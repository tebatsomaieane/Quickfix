#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# QuickFix — initialise the MySQL database from schema + seed.
# Used for standalone (non-Docker) deployments.
#
#   ./deploy/init-db.sh
#   ./deploy/init-db.sh --without-seed   # schema only
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f server/.env ]; then
    set -a
    # shellcheck disable=SC1091
    source server/.env
    set +a
fi

DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-quickfix}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"

MYSQL_ARGS=(--host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER")
[ -n "$DB_PASSWORD" ] && MYSQL_ARGS+=(--password="$DB_PASSWORD")

echo "==> Creating database '$DB_NAME' if it does not exist..."
mysql "${MYSQL_ARGS[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "==> Applying schema.sql..."
mysql "${MYSQL_ARGS[@]}" "$DB_NAME" < database/schema.sql

if [ "${1:-}" != "--without-seed" ]; then
    echo "==> Applying seed.sql (demo data)..."
    mysql "${MYSQL_ARGS[@]}" "$DB_NAME" < database/seed.sql
fi

echo "==> Done."