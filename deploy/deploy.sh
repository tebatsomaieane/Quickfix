#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# QuickFix — deploy with Docker Compose (Linux / macOS)
#
#   cp .env.example .env   # then edit values (JWT_SECRET is required)
#   ./deploy/deploy.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building and starting QuickFix stack..."
docker compose build --pull
docker compose up -d

echo "==> Waiting for services to become healthy..."
docker compose ps

echo ""
echo "QuickFix is up."
echo "  Web app:   http://localhost:${CLIENT_PORT:-80}"
echo "  API health: http://localhost:${CLIENT_PORT:-80}/api/health"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f server   # watch API logs"
echo "  docker compose down            # stop (keeps the database)"
echo "  docker compose down -v         # stop AND wipe the database"