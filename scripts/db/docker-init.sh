#!/bin/sh
# Docker entrypoint hook: runs scripts/db/init.sql once, when the volume is first created.
set -eu
psql -v ON_ERROR_STOP=1 \
  -v owner_password="${IDME_DB_OWNER_PASSWORD:?IDME_DB_OWNER_PASSWORD is required}" \
  -v app_password="${IDME_DB_APP_PASSWORD:?IDME_DB_APP_PASSWORD is required}" \
  --username "$POSTGRES_USER" --dbname postgres \
  -f /idme-sql/init.sql
