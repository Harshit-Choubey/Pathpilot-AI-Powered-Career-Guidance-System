#!/bin/bash
echo "==================================================="
echo "    PathPilot: Career Execution OS - Local Setup"
echo "==================================================="
echo ""

echo "[1/3] Checking environment variables..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "Please make sure to add your GEMINI_API_KEY to backend/.env if you want AI features."
fi

echo ""
echo "[2/3] Starting backend services (Docker)..."
docker-compose up -d --build

echo ""
echo "[3/3] Starting frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting Vite dev server..."
# Open browser depending on OS
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &
elif command -v open &> /dev/null; then
    open http://localhost:5173 &
fi

npm run dev
