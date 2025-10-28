#!/usr/bin/env bash
set -Eeuo pipefail

echo "[setup-elasticsearch] start"

# secrets
ELASTIC_PASSWORD="$(tr -d '\r\n' < /run/secrets/elasticsearch_password)"
KIBANA_PASSWORD="$(tr -d '\r\n' < /run/secrets/kibana_password)"
[ -n "$ELASTIC_PASSWORD" ] && [ -n "$KIBANA_PASSWORD" ] || { echo "[setup-elasticsearch] missing ELASTIC_PASSWORD / KIBANA_PASSWORD"; exit 1; }

# env
ES_HOME="/usr/share/elasticsearch"
CERTS="$ES_HOME/config/certs"
CA="$CERTS/ca/ca.crt"
ELASTIC_URL=${ELASTIC_URL:-https://elasticsearch:9200}
ELASTIC_USER=${ELASTIC_USER:-elastic}
KIBANA_USER=${KIBANA_USER:-kibana_system}


CURL() { curl -sS --fail-with-body --cacert "$CA" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" "$@"; }

echo "[setup-elasticsearch] waiting for Elasticsearch (TLS+auth)..."
until curl -fsS --cacert "$CA" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
  "$ELASTIC_URL/_cluster/health?wait_for_status=yellow&timeout=30s" >/dev/null; do
  sleep 5
done

# set kibana_system password
echo "[setup-elasticsearch] setting ${KIBANA_USER:-kibana_system} password"
for i in $(seq 1 30); do
  code=$(curl -s --cacert "$CA" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
    -o /dev/null -w '%{http_code}' \
    -X POST "$ELASTIC_URL/_security/user/${KIBANA_USER:-kibana_system}/_password" \
    -H 'Content-Type: application/json' \
    -d "{\"password\":\"${KIBANA_PASSWORD}\"}")
  [ "$code" = "200" ] && { echo "[setup-elasticsearch] password set OK"; break; }
  sleep 5
done
[ "$code" = "200" ] || { echo "[setup-elasticsearch] password set timeout"; exit 1; }

# ILM policy: app-logs
echo "[setup-elasticsearch] Put ILM policy app-logs-policy"
CURL -X PUT "$ELASTIC_URL/_ilm/policy/app-logs-policy" \
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
echo "[setup-elasticsearch] Put index template app-logs-single-node"
CURL -X PUT "$ELASTIC_URL/_index_template/app-logs-single-node" \
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
echo "[setup-elasticsearch] Put ILM policy nginx-logs-policy"
CURL  -X PUT "$ELASTIC_URL/_ilm/policy/nginx-logs-policy" \
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
echo "[setup-elasticsearch] Put index template logstash-single-node"
CURL -X PUT "$ELASTIC_URL/_index_template/logstash-single-node" \
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

echo "[setup-elasticsearch] all done"
