#!/usr/bin/env bash
set -Eeuo pipefail

echo "[setup-certs] start"

# secrets
# srcs
SECRETS_DIR="/run/secrets"
ES_PASS_SRC="${SECRETS_DIR}/elasticsearch_password"
KB_PASS_SRC="${SECRETS_DIR}/kibana_password"
KBN_SECURITY_KEY_SRC="${SECRETS_DIR}/kbn_security_key"
KBN_ESO_KEY_SRC="${SECRETS_DIR}/kbn_eso_key"
KBN_REPORTING_KEY_SRC="${SECRETS_DIR}/kbn_reporting_key"

# dest dirs
APP_SECRETS_DIR="/work/app-secrets"
ES_SECRETS_DIR="/work/es-secrets"
KB_SECRETS_DIR="/work/kb-secrets"

copy_secret() {
  local src="$1" dst="$2" mode="$3" owner="${4:-}"

  [[ -r "$src" ]] || { echo "[setup-certs] ERROR: ${src} is not readable" >&2; exit 1; }

  mkdir -p -- "$(dirname "$dst")"

  if [[ ! -f "$dst" ]]; then
    if command -v install >/dev/null 2>&1 && \
       install -D -m "$mode" ${owner:+-o "${owner%:*}" -g "${owner#*:}"} "$src" "$dst" 2>/dev/null; then
      :
    else
      cp -- "$src" "$dst"
      chmod "$mode" "$dst"
      [[ -n "$owner" ]] && chown "$owner" "$dst"
    fi
  fi
}

# ---------- copy secrets ----------
# ES for app
copy_secret "$ES_PASS_SRC" "${APP_SECRETS_DIR}/elasticsearch_password" 444 "0:0"
# Elasticsearch
copy_secret "$ES_PASS_SRC" "${ES_SECRETS_DIR}/elasticsearch_password" 600 "1000:0"
# Kibana
copy_secret "$KB_PASS_SRC" "${KB_SECRETS_DIR}/kibana_password" 600 "1000:1000"
copy_secret "$KBN_SECURITY_KEY_SRC"   "${KB_SECRETS_DIR}/kbn_security_key"   600 "1000:1000"
copy_secret "$KBN_ESO_KEY_SRC"        "${KB_SECRETS_DIR}/kbn_eso_key"        600 "1000:1000"
copy_secret "$KBN_REPORTING_KEY_SRC"  "${KB_SECRETS_DIR}/kbn_reporting_key"  600 "1000:1000"

echo "[setup-certs] secrets staged"

# CA
ES_HOME="/usr/share/elasticsearch"
CERTS="$ES_HOME/config/certs"

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
