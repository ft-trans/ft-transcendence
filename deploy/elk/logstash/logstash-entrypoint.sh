#!/bin/sh
set -eu

# secrets -> env
ELASTIC_PASSWORD="$(tr -d '\r\n' </run/es-secrets/elasticsearch_password || true)"
[ -n "${ELASTIC_PASSWORD:-}" ] || { echo "[logstash] missing elasticsearch_password"; exit 1; }
export ELASTIC_PASSWORD

# defaults
export ELASTIC_URL="${ELASTIC_URL:-https://elasticsearch:9200}"
export ELASTIC_USER="${ELASTIC_USER:-elastic}"

# CA check
CERTS_DIR="${CERTS_DIR:-/usr/share/logstash/config/certs}"
[ -r "$CERTS_DIR/ca/ca.crt" ] || { echo "[logstash] missing CA: $CERTS_DIR/ca/ca.crt"; exit 1; }

# official entrypoint
exec /usr/local/bin/docker-entrypoint logstash -f /usr/share/logstash/pipeline/logstash.conf