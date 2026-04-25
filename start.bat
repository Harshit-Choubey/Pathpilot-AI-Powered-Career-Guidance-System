@echo off
echo ===================================================
echo     PathPilot: Career Execution OS - Local Setup
echo ===================================================
echo.

echo [1/3] Checking environment variables...
if not exist "backend\.env" (
    echo Creating backend\.env from example...
    copy backend\.env.example backend\.env > nul
    echo Please make sure to add your GEMINI_API_KEY to backend\.env if you want AI features.
)

echo.
echo [2/3] Starting backend services (Docker)...
docker-compose up -d --build

echo.
echo [3/3] Starting frontend...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo Starting Vite dev server...
start http://localhost:5173
call npm run dev
