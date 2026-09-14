# ─────────────────────────────────────────────────────────────
# QuickFix — deploy with Docker Compose (Windows / PowerShell)
#
#   Copy-Item .env.example .env   # then edit values (JWT_SECRET required)
#   .\deploy\deploy.ps1
# ─────────────────────────────────────────────────────────────
param(
    [switch]$Down
)

Set-Location "$PSScriptRoot\.."

if ($Down) {
    docker compose down
    exit $LASTEXITCODE
}

Write-Host "==> Building and starting QuickFix stack..."
docker compose build --pull
docker compose up -d

Write-Host "==> Services:"
docker compose ps

Write-Host ""
$ClientPort = if ($env:CLIENT_PORT) { $env:CLIENT_PORT } else { "80" }
Write-Host "QuickFix is up."
Write-Host "  Web app:    http://localhost:$ClientPort"
Write-Host "  API health: http://localhost:$ClientPort/api/health"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  docker compose logs -f server   # watch API logs"
Write-Host "  docker compose down            # stop (keeps the database)"
Write-Host "  docker compose down -v         # stop AND wipe the database"