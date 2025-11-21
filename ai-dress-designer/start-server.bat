@echo off
chcp 65001 >nul

REM Change to script directory
cd /d "%~dp0"

cls

echo ========================================================
echo      AI Dress Designer - Server Startup
echo ========================================================
echo.
echo Starting server...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Check node_modules
if not exist "node_modules\" (
    echo [WARNING] Dependencies not installed. Installing...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
)

REM Check .env.local
if not exist ".env.local" (
    echo.
    echo [WARNING] .env.local file not found!
    echo.
    echo Please create .env.local and add your API keys
    echo Check .env.example for reference
    echo.
    pause
)

echo [OK] All requirements met
echo.
echo --------------------------------------------------------
echo.
echo Server will run on: http://localhost:3000
echo.
echo Tips:
echo   - To stop server: Press Ctrl+C
echo   - Open browser: http://localhost:3000
echo   - Design page: http://localhost:3000/design
echo.
echo --------------------------------------------------------
echo.
echo Starting application...
echo.

REM Start server on port 3000
npm run dev

REM If server stops
echo.
echo --------------------------------------------------------
echo.
echo [INFO] Server stopped
echo.
pause

