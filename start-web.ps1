# Need It - Web Frontend Startup Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Need It Web (Vite + React)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WebDir = Join-Path $PSScriptRoot "web"

Push-Location $WebDir
try {
    Write-Host "[1/1] Starting Vite Dev Server on http://0.0.0.0:3000 ..." -ForegroundColor Green
    Write-Host "Local URL:   http://localhost:3000" -ForegroundColor Gray
    Write-Host "Network URL: http://172.22.17.13:3000 (Open on your phone)" -ForegroundColor Magenta
    Write-Host "Vite automatically proxies /api requests to Django on http://127.0.0.1:8000" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    npm run dev
} finally {
    Pop-Location
}
