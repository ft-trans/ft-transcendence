#!/usr/bin/env bash
set -Eeuo pipefail

echo "[setup] start"

# secrets
ELASTIC_PASSWORD="$(tr -d '\r\n' < /run/secrets/elasticsearch_password)"
KIBANA_PASSWORD="$(tr -d '\r\n' < /run/secrets/kibana_password)"
[ -n "$ELASTIC_PASSWORD" ] && [ -n "$KIBANA_PASSWORD" ] || { echo "[setup] missing ELASTIC_PASSWORD / KIBANA_PASSWORD"; exit 1; }

ES_HOME="/usr/share/elasticsearch"
CERTS="$ES_HOME/config/certs"
ES_URL="https://es01:9200"
KBN_URL="https://kibana:5601"
ES_USER="elastic"
ES_PASS="${ELASTIC_PASSWORD}"

# CA
if [ ! -f "$CERTS/ca/ca.crt" ]; then
  echo "[setup] creating CA"
  "$ES_HOME/bin/elasticsearch-certutil" ca --silent --pem -out "$CERTS/ca.zip"
  unzip -q "$CERTS/ca.zip" -d "$CERTS"
fi

# instance certs
if [ ! -f "$CERTS/es01/es01.crt" ]; then
  echo "[setup] creating instance certs"
  cat > "$CERTS/instances.yml" <<'YML'
instances:
  - name: es01
    dns: [es01, localhost]
    ip:  [127.0.0.1]
  - name: kibana
    dns: [kibana, localhost]
    ip:  [127.0.0.1]
  - name: logstash01
    dns: [logstash01, localhost]
    ip:  [127.0.0.1]
YML
  "$ES_HOME/bin/elasticsearch-certutil" cert --silent --pem \
    -out "$CERTS/certs.zip" \
    --in "$CERTS/instances.yml" \
    --ca-cert "$CERTS/ca/ca.crt" \
    --ca-key  "$CERTS/ca/ca.key"
  unzip -q "$CERTS/certs.zip" -d "$CERTS"
fi

# perms（certs配下だけ）
echo "[setup] setting file permissions"
chown -R root:root "$CERTS"
find "$CERTS" -type d -exec chmod 750 {} \;
find "$CERTS" -type f -exec chmod 640 {} \;

# perms: CA
chmod 755 "$CERTS"                  # /usr/share/elasticsearch/config/certs
chmod 755 "$CERTS/ca"
chmod 644 "$CERTS/ca/ca.crt"        # 公開証明書

# perms: kibana
if [ -d "$CERTS/kibana" ]; then
  chown -R 1000:0 "$CERTS/kibana"
  chmod 640 "$CERTS/kibana/kibana.key"
  chmod 644 "$CERTS/kibana/kibana.crt"
fi

# wait ES
echo "[setup] waiting for Elasticsearch (cluster health >= yellow)"
until curl -fsS \
  --cacert "$CERTS/ca/ca.crt" \
  -u "$ES_USER:$ES_PASS" \
  "$ES_URL/_cluster/health?wait_for_status=yellow&timeout=30s" >/dev/null; do
  sleep 5
done

# set kibana_system password
echo "[setup] setting kibana_system password"
until curl -s -X POST --cacert "$CERTS/ca/ca.crt" \
  -u "elastic:${ELASTIC_PASSWORD}" -H "Content-Type: application/json" \
  https://es01:9200/_security/user/kibana_system/_password \
  -d "{\"password\":\"${KIBANA_PASSWORD}\"}" | grep -q '^{}'; do
  sleep 5
done

# ILM policy: app-logs
echo "[setup] Put ILM policy app-logs-policy"
curl -sS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  -X PUT "$ES_URL/_ilm/policy/app-logs-policy" \
  -H 'Content-Type: application/json' -d @- <<'JSON' | grep -q '"acknowledged":true'
{
  "policy": {
    "phases": {
      "hot":   { "min_age": "0ms", "actions": {} },
      "delete":{ "min_age": "30d", "actions": { "delete": {} } }
    },
    "_meta": { "description": "app logs retention 30d" }
  }
}
JSON

# Index template: app-logs* に ILM を適用（replicas=0）
echo "[setup] Put index template app-logs-single-node"
curl -sS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  -X PUT "$ES_URL/_index_template/app-logs-single-node" \
  -H 'Content-Type: application/json' -d @- <<'JSON' | grep -q '"acknowledged":true'
{
  "index_patterns": ["app-logs*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "app-logs-policy",
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }
}
JSON

# ILM policy: nginx-logs-policy
echo "[setup] Put ILM policy nginx-logs-policy"
curl -sS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  -X PUT "$ES_URL/_ilm/policy/nginx-logs-policy" \
  -H 'Content-Type: application/json' -d @- <<'JSON' | grep -q '"acknowledged":true'
{
  "policy": {
    "phases": {
      "hot":   { "min_age": "0ms", "actions": {} },
      "warm":  { "min_age": "2d",  "actions": {} },
      "cold":  { "min_age": "7d",  "actions": { "readonly": {} } },
      "delete":{ "min_age": "30d", "actions": { "delete": {} } }
    },
    "_meta": { "description": "nginx logs retention 30d (hot→warm 2d→cold 7d)" }
  }
}
JSON

# Index template: logstash-* に ILM を適用（replicas は 0） 
echo "[setup] Put index template logstash-single-node"
curl -sS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  -X PUT "$ES_URL/_index_template/logstash-single-node" \
  -H 'Content-Type: application/json' -d @- <<'JSON' | grep -q '"acknowledged":true'
{
  "index_patterns": ["logstash-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "nginx-logs-policy",
      "number_of_shards": 1,
      "number_of_replicas": 0
    }
  }
}
JSON

# Persistent setup for the number of replicas
echo "[setup] Put default setup for the number of replicas"
curl -sS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  -X PUT "$ES_URL/_cluster/settings" \
  -H 'Content-Type: application/json' \
  -d '{"persistent":{"index.number_of_replicas":0}}' >/dev/null

# Kibana 起動待ち（認証付きで /api/status）
echo "[setup] Wating for kibana to be available"

until curl -fsS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  "$KBN_URL/api/status" | grep -q '"level":"available"'; do
  sleep 5
done

# Dashboard + DataView の読み込み 
echo "[setup] Importing Kibana dashboard"
curl -sS --cacert "$CERTS/ca/ca.crt" -u "$ES_USER:$ES_PASS" \
  -X POST "$KBN_URL/api/saved_objects/_import?overwrite=true" \
  -H 'kbn-xsrf: true' \
  -F file=@/usr/share/elasticsearch/config/dashboard.ndjson

echo "[setup] all done"