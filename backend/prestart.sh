#!/bin/bash
set -e

echo "Running Database Migrations..."
alembic upgrade head

echo "Starting Uvicorn Server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
