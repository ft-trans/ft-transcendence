#!/usr/bin/env bash
set -Eeuo pipefail

export KIBANA_USER="${KIBANA_USER:-kibana_system}"
export KIBANA_PASSWORD="$(tr -d '\r\n' < /run/secrets/kibana_password)"
export KBN_SECURITY_KEY="$(tr -d '\r\n' < /run/secrets/kbn_security_key)"
export KBN_ENCRYPTED_SAVED_OBJECTS_KEY="$(tr -d '\r\n' < /run/secrets/kbn_eso_key)"
export KBN_REPORTING_KEY="$(tr -d '\r\n' < /run/secrets/kbn_reporting_key)"

exec /usr/local/bin/kibana-docker
