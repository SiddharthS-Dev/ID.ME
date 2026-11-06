#!/usr/bin/env bash
# Local PostgreSQL without Docker (ADR-0017).
# Uses binaries from $PG_BIN, or the portable build in .tools/pgsql/bin, or PATH.
#
#   scripts/dev-db.sh init     # create cluster, roles and databases (idme, idme_test)
#   scripts/dev-db.sh start    # start on port $IDME_DB_PORT (default 55432)
#   scripts/dev-db.sh stop
#   scripts/dev-db.sh status
#   scripts/dev-db.sh psql [db]
#
# Development-only defaults; override with environment variables. Never reuse in production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${IDME_DB_PORT:-55432}"
DATA="${IDME_DB_DATA:-$ROOT/.tools/pgdata}"
LOG="${IDME_DB_LOG:-$ROOT/.tools/postgres.log}"
OWNER_PW="${IDME_DB_OWNER_PASSWORD:-idme_owner_dev}"
APP_PW="${IDME_DB_APP_PASSWORD:-idme_app_dev}"

if [[ -n "${PG_BIN:-}" ]]; then BIN="$PG_BIN";
elif [[ -x "$ROOT/.tools/pgsql/bin/postgres" || -x "$ROOT/.tools/pgsql/bin/postgres.exe" ]]; then BIN="$ROOT/.tools/pgsql/bin";
else BIN="$(dirname "$(command -v postgres)")"; fi

cmd="${1:-status}"
case "$cmd" in
  init)
    if [[ -f "$DATA/PG_VERSION" ]]; then echo "Cluster already exists at $DATA"; else
      pwfile="$(mktemp)"; trap 'rm -f "$pwfile"' EXIT
      # Local superuser password is random and discarded; local access uses the OS user via trust on loopback only.
      head -c 24 /dev/urandom | base64 > "$pwfile"
      "$BIN/initdb" -D "$DATA" -U postgres --pwfile="$pwfile" -E UTF8 --locale=C \
        --auth-local=trust --auth-host=scram-sha-256 >/dev/null
      # Allow the superuser on loopback without password for local administration only.
      printf 'host all postgres 127.0.0.1/32 trust\nhost all postgres ::1/128 trust\n' | cat - "$DATA/pg_hba.conf" > "$DATA/pg_hba.tmp" && mv "$DATA/pg_hba.tmp" "$DATA/pg_hba.conf"
      echo "Initialized cluster at $DATA"
    fi
    "$0" start
    "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q \
      -v owner_password="$OWNER_PW" -v app_password="$APP_PW" -f "$ROOT/scripts/db/init.sql"
    echo "Roles idme_owner/idme_app and databases idme/idme_test are ready on port $PORT"
    ;;
  start)
    if "$BIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1; then echo "Already running"; exit 0; fi
    # Detach all standard handles: on Windows the postmaster otherwise inherits the caller's pipe.
    "$BIN/pg_ctl" -D "$DATA" -l "$LOG" -o "-p $PORT -h 127.0.0.1" -w start </dev/null >/dev/null 2>&1
    echo "PostgreSQL started on 127.0.0.1:$PORT (log: $LOG)"
    ;;
  stop)   "$BIN/pg_ctl" -D "$DATA" -m fast stop ;;
  status) "$BIN/pg_ctl" -D "$DATA" status || true ;;
  psql)   shift; "$BIN/psql" -h 127.0.0.1 -p "$PORT" -U postgres -d "${1:-idme}" ;;
  *) echo "Unknown command: $cmd"; exit 2 ;;
esac
