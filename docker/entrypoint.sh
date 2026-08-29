#!/bin/sh
# Wait for Postgres, apply migrations, then start the Nitro Node server.
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[stella] DATABASE_URL is required. Use docker compose or pass it in." >&2
  exit 1
fi

echo "[stella] applying migrations…"
i=0
until node scripts/migrate.mjs; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[stella] database never became ready" >&2
    exit 1
  fi
  echo "[stella] database not ready, retrying ($i/30)…"
  sleep 2
done

host="${NITRO_HOST:-${HOST:-0.0.0.0}}"
port="${NITRO_PORT:-${PORT:-3000}}"
echo "[stella] listening on ${host}:${port}"
exec node .output/server/index.mjs
