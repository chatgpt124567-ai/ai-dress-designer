# AI Dress Designer - Server Startup Script
# Encoding: UTF-8 with BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Clear-Host

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "     AI Dress Designer - Server Startup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARNING] Dependencies not installed. Installing..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Failed to install dependencies!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host ""
    Write-Host "[OK] Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Check .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host ""
    Write-Host "[WARNING] .env.local file not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create .env.local and add your API keys" -ForegroundColor Yellow
    Write-Host "Check .env.example for reference" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway"
}

Write-Host "[OK] All requirements met" -ForegroundColor Green
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will run on: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  - To stop server: Press Ctrl+C" -ForegroundColor White
Write-Host "  - Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "  - Design page: http://localhost:3000/design" -ForegroundColor White
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting application..." -ForegroundColor Magenta
Write-Host ""

# Start server on port 3000
npm run dev

# If server stops
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Server stopped" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"

