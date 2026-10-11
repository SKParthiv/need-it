# Need It - Backend Startup Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Need It Backend (Django REST API)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$BackendDir = Join-Path $PSScriptRoot "backend"
$PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Error "Virtual environment not found at $PythonExe. Please create it first."
    exit 1
}

Push-Location $BackendDir
try {
    Write-Host "[1/3] Checking migrations..." -ForegroundColor Yellow
    & $PythonExe manage.py migrate --no-input

    Write-Host "[2/3] Verifying seeded test accounts..." -ForegroundColor Yellow
    & $PythonExe seed_test_accounts.py

    Write-Host "[3/3] Starting Django API server on http://0.0.0.0:8000 ..." -ForegroundColor Green
    Write-Host "Accessible locally via http://127.0.0.1:8000" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    & $PythonExe manage.py runserver 0.0.0.0:8000
} finally {
    Pop-Location
}
