#!/bin/bash
echo "==================================================="
echo "    PathPilot: Career Execution OS - Local Setup"
echo "==================================================="
echo ""

echo "[1/3] Checking environment variables..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "Please make sure to add your API keys to backend/.env if you want AI features."
fi

echo ""
echo "[2/3] Starting full-stack services (Docker)..."
echo "This will spin up the Database, Redis, ML Engine, FastAPI Backend, and React Frontend."
docker-compose up -d --build

echo ""
echo "[3/3] PathPilot is launching!"
echo "The initial build might take a minute."
echo ""
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/api/v1/docs"
echo "Health Check: http://localhost:8000/health"
echo ""
echo "Use 'docker-compose down' to stop the servers."
