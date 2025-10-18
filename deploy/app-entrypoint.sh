#!/usr/bin/env bash
set -Eeuo pipefail

: "${ELASTIC_PASSWORD_FILE:=/run/secrets/elasticsearch_password}"

if [[ -z "${ELASTIC_PASSWORD:-}" ]] && [[ -f "${ELASTIC_PASSWORD_FILE}" ]]; then
  export ELASTIC_PASSWORD="$(tr -d '\r\n' < "${ELASTIC_PASSWORD_FILE}")"
fi

if [[ -z "${ELASTIC_PASSWORD:-}" ]]; then
  echo "[app-entrypoint] ELASTIC_PASSWORD is missing (env or ${ELASTIC_PASSWORD_FILE})" >&2
  exit 1
fi

exec "$@"