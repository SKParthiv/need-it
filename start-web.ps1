# Need It - Web Frontend Startup Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Need It Web (Vite + React)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$WebDir = Join-Path $PSScriptRoot "web"

Push-Location $WebDir
try {
    Write-Host "[1/1] Starting Vite Dev Server on http://0.0.0.0:3000 ..." -ForegroundColor Green
    Write-Host "Local URL:   http://localhost:3000" -ForegroundColor Gray

    # Prefer real LAN adapters (192.168.x.x / 10.x.x.x). 172.x addresses are
    # usually WSL/Hyper-V virtual switches — phones CANNOT reach those.
    $LanIp = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -match '^(192\.168\.|10\.)' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress
    if ($LanIp) {
        Write-Host "Network URL: http://${LanIp}:3000  <- open THIS on your phone (same Wi-Fi)" -ForegroundColor Magenta
    } else {
        Write-Host "Network URL: check the URLs Vite prints below (use the 192.168.x.x one)" -ForegroundColor Magenta
    }

    Write-Host "Vite automatically proxies /api requests to Django on http://127.0.0.1:8000" -ForegroundColor Gray
    Write-Host "If your phone still cannot connect: allow 'node' and 'python' through" -ForegroundColor Yellow
    Write-Host "Windows Defender Firewall (first-run prompt, or see docs/client-and-api-testing.md)." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    npm run dev
} finally {
    Pop-Location
}
