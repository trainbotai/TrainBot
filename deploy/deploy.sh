#!/usr/bin/env bash
# TrainBot deploy script — run from Mac after SSH unblock
# Usage: bash deploy/deploy.sh
set -euo pipefail

SSH_CMD="sshpass -p Modulus08 ssh -p 2023 -o StrictHostKeyChecking=accept-new moldluca@92.85.94.170"
RSYNC_CMD="sshpass -p Modulus08 rsync -avz"
SSH_OPT="-e 'sshpass -p Modulus08 ssh -p 2023 -o StrictHostKeyChecking=accept-new'"
REMOTE_BASE="/mnt/Data/trainbot"
BACKEND_LOCAL="/Users/moldluca/Claude/proiecte - personale/TrainBot/source/TrainBot/backend"
DEPLOY_LOCAL="/Users/moldluca/Claude/proiecte - personale/TrainBot/source/TrainBot/deploy"

echo "=== Step 1: Create remote directory ==="
$SSH_CMD "mkdir -p $REMOTE_BASE && mkdir -p $REMOTE_BASE/uploads"

echo "=== Step 2: Rsync backend ==="
eval $RSYNC_CMD --exclude node_modules --exclude .env --exclude build --exclude dist --exclude .git \
  -e \"sshpass -p Modulus08 ssh -p 2023 -o StrictHostKeyChecking=accept-new\" \
  \"$BACKEND_LOCAL/\" \
  moldluca@92.85.94.170:$REMOTE_BASE/backend/

echo "=== Step 3: Copy docker-compose.yml and .env ==="
eval $RSYNC_CMD -e \"sshpass -p Modulus08 ssh -p 2023 -o StrictHostKeyChecking=accept-new\" \
  \"$DEPLOY_LOCAL/docker-compose.yml\" \
  \"$DEPLOY_LOCAL/.env\" \
  moldluca@92.85.94.170:$REMOTE_BASE/

echo "=== Step 4: chmod .env ==="
$SSH_CMD "chmod 600 $REMOTE_BASE/.env"

echo "=== Step 5: Docker build + up ==="
$SSH_CMD "cd $REMOTE_BASE && docker compose up -d --build 2>&1 | tail -30"

echo "=== Step 6: Wait for postgres healthy (max 30s) ==="
$SSH_CMD "for i in \$(seq 1 6); do docker compose -f $REMOTE_BASE/docker-compose.yml exec postgres pg_isready -U trainbot -d trainbot_prod && break || sleep 5; done"

echo "=== Step 7: Prisma migrate ==="
$SSH_CMD "cd $REMOTE_BASE && docker compose exec -T backend node -e \"require('child_process').execSync('npx prisma migrate deploy', {stdio:'inherit', cwd:'/app'})\" 2>&1 || docker compose exec -T backend sh -c 'cd /app && npx prisma migrate deploy'"

echo "=== Step 8: Health check ==="
$SSH_CMD "curl -sf http://localhost:3000/health || curl -sf http://localhost:3000/api/v1"

echo "=== Step 9: Seed DB ==="
$SSH_CMD "cd $REMOTE_BASE && docker compose exec -T backend node prisma/seed.mjs"

echo "=== DEPLOY COMPLETE ==="
