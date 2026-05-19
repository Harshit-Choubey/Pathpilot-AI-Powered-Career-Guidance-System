@echo off
setlocal EnableDelayedExpansion
title PathPilot — Career Execution OS
color 0A

echo.
echo  ======================================================
echo       PathPilot: Career Execution OS — Launcher
echo  ======================================================
echo.

:: ─────────────────────────────────────────────────────────────────────────────
:: STEP 1 — Check Docker Desktop
:: ─────────────────────────────────────────────────────────────────────────────
echo [1/6] Checking Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Docker Desktop is NOT running or not installed!
    echo.
    echo  Please:
    echo    1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo    2. Install and start Docker Desktop
    echo    3. Wait until the whale icon in the taskbar is steady
    echo    4. Run this script again
    echo.
    pause
    exit /b 1
)
echo    Docker Desktop is running. OK

:: ─────────────────────────────────────────────────────────────────────────────
:: STEP 2 — Check Docker Compose v2
:: ─────────────────────────────────────────────────────────────────────────────
echo.
echo [2/6] Checking Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Docker Compose v2 not found.
    echo  Please update Docker Desktop to the latest version.
    pause
    exit /b 1
)
echo    Docker Compose v2 available. OK

:: ─────────────────────────────────────────────────────────────────────────────
:: STEP 3 — Set up ROOT .env (for docker-compose)
:: ─────────────────────────────────────────────────────────────────────────────
echo.
echo [3/6] Setting up environment files...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo    Created root .env from .env.example
    ) else (
        echo  ERROR: .env.example not found. The zip may be incomplete.
        pause
        exit /b 1
    )
) else (
    echo    Root .env already exists. OK
)

:: Set up backend .env (for local dev reference)
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo    Created backend\.env from backend\.env.example
    )
) else (
    echo    backend\.env already exists. OK
)

:: ─────────────────────────────────────────────────────────────────────────────
:: STEP 4 — Collect API Keys
:: ─────────────────────────────────────────────────────────────────────────────
echo.
echo [4/6] Configuring API keys...

:: Check GROQ_API_KEY in root .env
set "GROQ_SET=0"
for /F "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="GROQ_API_KEY" if not "%%B"=="" set "GROQ_SET=1"
)
if "!GROQ_SET!"=="0" (
    echo.
    echo  ┌─────────────────────────────────────────────────────┐
    echo  │  OPTIONAL: Groq API Key (AI Chat + Roadmap Gen)     │
    echo  │  Free key at: https://console.groq.com              │
    echo  │  Press ENTER to skip (AI features disabled)         │
    echo  └─────────────────────────────────────────────────────┘
    set /P "GROQ_KEY=  Groq API Key: "
    if not "!GROQ_KEY!"=="" (
        powershell -NoProfile -Command ^
            "(Get-Content '.env') -replace '^GROQ_API_KEY=.*', 'GROQ_API_KEY=!GROQ_KEY!' | Set-Content '.env'"
        echo    Groq API key saved.
    ) else (
        echo    Skipped Groq key.
    )
)

:: Check GEMINI_API_KEY in root .env
set "GEMINI_SET=0"
for /F "usebackq tokens=1,* delims==" %%A in (".env") do (
    if "%%A"=="GEMINI_API_KEY" if not "%%B"=="" set "GEMINI_SET=1"
)
if "!GEMINI_SET!"=="0" (
    echo.
    echo  ┌─────────────────────────────────────────────────────┐
    echo  │  OPTIONAL: Gemini API Key (AI Roadmap Generation)   │
    echo  │  Free key at: https://aistudio.google.com/app/apikey│
    echo  │  Press ENTER to skip                                 │
    echo  └─────────────────────────────────────────────────────┘
    set /P "GEMINI_KEY=  Gemini API Key: "
    if not "!GEMINI_KEY!"=="" (
        powershell -NoProfile -Command ^
            "(Get-Content '.env') -replace '^GEMINI_API_KEY=.*', 'GEMINI_API_KEY=!GEMINI_KEY!' | Set-Content '.env'"
        echo    Gemini API key saved.
    ) else (
        echo    Skipped Gemini key.
    )
)
echo    Environment ready. OK

:: ─────────────────────────────────────────────────────────────────────────────
:: STEP 5 — Build and Start all services
:: ─────────────────────────────────────────────────────────────────────────────
echo.
echo [5/6] Building and starting all services with Docker...
echo    NOTE: First run takes 5-15 minutes (downloads ~2GB of images).
echo    Subsequent runs start in under 60 seconds.
echo.
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo  ERROR: One or more services failed to start.
    echo  Run this command to see what went wrong:
    echo    docker compose logs --tail=100
    echo.
    pause
    exit /b 1
)

:: ─────────────────────────────────────────────────────────────────────────────
:: STEP 6 — Wait for backend health, then open browser
:: ─────────────────────────────────────────────────────────────────────────────
echo.
echo [6/6] Waiting for PathPilot to become ready...
echo    (First run: up to 3 minutes while ML models load into memory)
echo.
set /A COUNTER=0
set /A MAX_WAIT=150

:WAIT_LOOP
set /A COUNTER+=1
if !COUNTER! GTR !MAX_WAIT! (
    echo.
    echo    Timed out waiting — PathPilot may still be starting up.
    echo    Try opening http://localhost in 30 seconds.
    goto DONE
)
for /F %%i in ('curl -s -o nul -w "%%{http_code}" http://localhost 2^>nul') do set HTTP_CODE=%%i
if "!HTTP_CODE!"=="200" goto DONE
set /P =".">nul
timeout /t 2 >nul
goto WAIT_LOOP

:DONE
echo.
echo.
echo  ======================================================
echo   PathPilot is LIVE!
echo.
echo   App      :  http://localhost
echo   API Docs :  http://localhost:8000/api/v1/docs
echo   Health   :  http://localhost:8000/health
echo.
echo   Stop all services :  docker compose down
echo   View logs         :  docker compose logs -f
echo   Rebuild           :  docker compose up --build
echo  ======================================================
echo.
start http://localhost
echo    Browser opened. Enjoy PathPilot!
echo.
pause
