# Test script to verify server startup
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Testing server startup script..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if we're in the right directory
Write-Host "[Test 1] Checking current directory..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor White

# Test 2: Check for package.json
Write-Host ""
Write-Host "[Test 2] Checking for package.json..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "[OK] package.json found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] package.json not found!" -ForegroundColor Red
    exit 1
}

# Test 3: Check for node_modules
Write-Host ""
Write-Host "[Test 3] Checking for node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "[OK] node_modules found" -ForegroundColor Green
} else {
    Write-Host "[WARNING] node_modules not found - will be installed on first run" -ForegroundColor Yellow
}

# Test 4: Check for app directory
Write-Host ""
Write-Host "[Test 4] Checking for app directory..." -ForegroundColor Yellow
if (Test-Path "app") {
    Write-Host "[OK] app directory found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] app directory not found!" -ForegroundColor Red
    exit 1
}

# Test 5: Check for next.config.ts
Write-Host ""
Write-Host "[Test 5] Checking for next.config.ts..." -ForegroundColor Yellow
if (Test-Path "next.config.ts") {
    Write-Host "[OK] next.config.ts found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] next.config.ts not found!" -ForegroundColor Red
    exit 1
}

# Test 6: Check for .env.local
Write-Host ""
Write-Host "[Test 6] Checking for .env.local..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "[OK] .env.local found" -ForegroundColor Green
} else {
    Write-Host "[WARNING] .env.local not found - you'll need to create it" -ForegroundColor Yellow
}

# Test 7: Check Node.js
Write-Host ""
Write-Host "[Test 7] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    exit 1
}

# Test 8: Check npm
Write-Host ""
Write-Host "[Test 8] Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] npm installed: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "[ERROR] npm is not installed!" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "                    Test Summary" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] All critical tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run the server using:" -ForegroundColor Yellow
Write-Host "  - .\start-server.ps1" -ForegroundColor White
Write-Host "  - .\start-server.bat" -ForegroundColor White
Write-Host "  - npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

