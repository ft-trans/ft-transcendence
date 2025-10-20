#!/usr/bin/env bash
set -Eeuo pipefail

echo "[setup-certs] start"

ES_HOME="/usr/share/elasticsearch"
CERTS="$ES_HOME/config/certs"

# CA
if [ ! -f "$CERTS/ca/ca.crt" ]; then
  echo "[setup-certs] creating CA"
  "$ES_HOME/bin/elasticsearch-certutil" ca --silent --pem -out "$CERTS/ca.zip"
  unzip -q "$CERTS/ca.zip" -d "$CERTS"
  rm -f "$CERTS/ca.zip"
fi

# instance certs
if [ ! -f "$CERTS/elasticsearch/elasticsearch.crt" ]; then
  echo "[setup-certs] creating instance certs"
  cat > "$CERTS/instances.yml" <<'YML'
instances:
  - name: elasticsearch
    dns: [elasticsearch, localhost]
    ip:  [127.0.0.1]
  - name: kibana
    dns: [kibana, localhost]
    ip:  [127.0.0.1]
  - name: logstash
    dns: [logstash, localhost]
    ip:  [127.0.0.1]
YML
  "$ES_HOME/bin/elasticsearch-certutil" cert --silent --pem \
    -out "$CERTS/certs.zip" \
    --in "$CERTS/instances.yml" \
    --ca-cert "$CERTS/ca/ca.crt" \
    --ca-key  "$CERTS/ca/ca.key"
  unzip -q "$CERTS/certs.zip" -d "$CERTS"
  rm -f "$CERTS/certs.zip" "$CERTS/instances.yml"
fi


# perms
echo "[setup-certs] setting file permissions"
chown -R root:root "$CERTS"
find "$CERTS" -type d -exec chmod 750 {} \;
find "$CERTS" -type f -exec chmod 640 {} \;

# perms: CA
chmod 755 "$CERTS"
chmod 755 "$CERTS/ca"
chmod 600 "$CERTS/ca/ca.key"
chmod 644 "$CERTS/ca/ca.crt"

# perms: elasticsearch
if [ -d "$CERTS/elasticsearch" ]; then
  chown -R 1000:0 "$CERTS/elasticsearch"
  chmod 640 "$CERTS/elasticsearch/elasticsearch.key"
  chmod 644 "$CERTS/elasticsearch/elasticsearch.crt"
fi

# perms: kibana
if [ -d "$CERTS/kibana" ]; then
  chown -R 1000:0 "$CERTS/kibana"
  chmod 640 "$CERTS/kibana/kibana.key"
  chmod 644 "$CERTS/kibana/kibana.crt"
fi

# perms: logstash
if [ -d "$CERTS/logstash" ]; then
  chown -R 1000:0 "$CERTS/logstash"
  chmod 640 "$CERTS/logstash/logstash.key"
  chmod 644 "$CERTS/logstash/logstash.crt"
fi

echo "[setup-certs] all done"
