#!/usr/bin/env bash
# TrainBot deploy script — run from Mac.
# Usage: bash deploy/deploy.sh [--seed]
#
# SSH goes through the `junioru` alias (Tailscale + SSH key) — no passwords in this file.
# docker-compose.yml and .env on the server are the source of truth (they hold
# literal secrets that differ from this repo's template) — this script never overwrites them.
set -euo pipefail

SSH="ssh junioru"
REMOTE_BASE="/mnt/Data/trainbot"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${VITE_API_URL:-https://trainbot-api.moldluca.tech/api/v1}"

echo "=== Step 1: Rsync backend ==="
rsync -az --delete --exclude node_modules --exclude .env --exclude dist --exclude .git \
  "$REPO/backend/" junioru:$REMOTE_BASE/backend/

echo "=== Step 2: Build web (VITE_API_URL=$API_URL) and rsync ==="
(cd "$REPO/web" && npm ci --silent && VITE_API_URL="$API_URL" npm run build)
rsync -az --delete "$REPO/web/dist/" junioru:$REMOTE_BASE/web-dist/

echo "=== Step 3: Rebuild backend + start ==="
$SSH "cd $REMOTE_BASE && docker compose up -d --build backend 2>&1 | tail -20"

echo "=== Step 4: Prisma migrate ==="
$SSH "cd $REMOTE_BASE && docker compose exec -T backend sh -c 'cd /app && npx prisma migrate deploy'"

echo "=== Step 5: Health check ==="
$SSH "for i in \$(seq 1 10); do curl -sf http://localhost:3000/health && exit 0; sleep 3; done; exit 1"

if [ "${1:-}" = "--seed" ]; then
  echo "=== Step 6: Seed DB ==="
  $SSH "cd $REMOTE_BASE && docker compose exec -T backend node prisma/seed.mjs"
fi

echo "=== DEPLOY COMPLETE ==="
