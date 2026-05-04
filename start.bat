@echo off
setlocal
echo ===================================================
echo     PathPilot: Career Execution OS - Local Setup
echo ===================================================
echo.

echo [1/5] Checking Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running or not installed.
    echo Please start Docker Desktop, wait until it is fully ready, and run this script again.
    pause
    exit /b 1
)

echo.
echo [2/5] Checking Docker Compose command...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose (v2) is not available.
    echo Update Docker Desktop to a version that includes ^`docker compose^`.
    pause
    exit /b 1
)

echo.
echo [3/5] Checking environment variables...
if not exist "backend\.env" (
    echo Creating backend\.env from example...
    copy backend\.env.example backend\.env > nul
    echo Please make sure to add your API keys to backend\.env if you want AI features.
)

echo.
echo [4/5] Starting full-stack services (Docker)...
echo This will spin up the Database, Redis, ML Engine, FastAPI Backend, and React Frontend.
docker compose up -d --build
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start one or more services.
    echo Check logs with: docker compose logs --tail=150
    pause
    exit /b 1
)

echo.
echo [5/5] PathPilot is launching!
echo The initial build might take a minute.
echo.
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/api/v1/docs
echo Health Check: http://localhost:8000/health
echo.
echo Opening browser...
timeout /t 5 > nul
start http://localhost:5173
echo Done! Use 'docker compose down' to stop the servers.
pause
