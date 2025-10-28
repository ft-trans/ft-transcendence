#!/bin/sh
set -eu

echo "[setup-kibana] start"

# secrets
ELASTIC_PASSWORD=$(tr -d '\r\n' </run/secrets/elasticsearch_password) || true
[ -n "${ELASTIC_PASSWORD:-}" ] || { echo "[setup-kibana] missing ELASTIC_PASSWORD"; exit 1; }

# env
ELASTIC_USER=${ELASTIC_USER:-elastic}
KIBANA_URL=${KIBANA_URL:-https://kibana:5601}
CERTS=${CERTS:-/certs}
DASH_FILE=${DASH_FILE:-/work/dashboard.ndjson}
[ -r "$CERTS/ca/ca.crt" ] || { echo "[setup-kibana] missing CA at $CERTS/ca/ca.crt"; exit 1; }
echo "[setup-kibana] CERTS=$CERTS"

# Dashboard + DataView import
echo "[setup-kibana] Importing dashboard to ${KIBANA_URL}"
status=$(curl -sS --cacert "${CERTS}/ca/ca.crt" -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -X POST "${KIBANA_URL}/api/saved_objects/_import?overwrite=true" \
  -H 'kbn-xsrf: true' -F "file=@${DASH_FILE}" \
  -w '%{http_code}' -o /tmp/kbn_resp.json)

# result check
if [ "$status" -ne 200 ] || ! grep -q '"success":true' /tmp/kbn_resp.json; then
  echo "[setup-kibana] import failed (status=${status})"
  cat /tmp/kbn_resp.json || true
  exit 1
fi

echo "[setup-kibana] all done"
