#!/bin/bash
set -e

echo "==================================================="
echo "    PathPilot: Career Execution OS - Local Setup"
echo "==================================================="
echo ""

echo "[1/5] Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running or not installed."
    echo "Please start Docker Desktop (or Docker Engine) and retry."
    exit 1
fi

echo ""
echo "[2/5] Checking Docker Compose..."
if ! docker compose version >/dev/null 2>&1; then
    echo "ERROR: Docker Compose v2 is not available."
    echo "Please update Docker to a version that supports 'docker compose'."
    exit 1
fi

echo ""
echo "[3/5] Checking environment variables..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "Please make sure to add your API keys to backend/.env if you want AI features."
fi

echo ""
echo "[4/5] Starting full-stack services (Docker)..."
echo "This will spin up the Database, Redis, ML Engine, FastAPI Backend, and React Frontend."
docker compose up -d --build

echo ""
echo "[5/5] PathPilot is launching!"
echo "The initial build might take a minute."
echo ""
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/api/v1/docs"
echo "Health Check: http://localhost:8000/health"
echo ""
echo "Use 'docker compose down' to stop the servers."
