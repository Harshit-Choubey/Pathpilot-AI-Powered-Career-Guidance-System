#!/bin/bash
# =============================================================================
# PathPilot Backend Prestart Script
# Runs DB migrations, creates runtime directories, then starts Uvicorn.
# =============================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           PathPilot Backend — Starting Up            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Ensure runtime directories exist ──────────────────────────────────
echo "[1/3] Creating runtime directories..."
mkdir -p /app/uploads /app/logs
echo "      ✓ /app/uploads and /app/logs ready"

# ── Step 2: Run Alembic migrations ───────────────────────────────────────────
echo ""
echo "[2/3] Running database migrations..."
alembic upgrade head
echo "      ✓ Migrations applied"

# Seed default database data (Careers and test user account)
echo ""
echo "Running database seed scripts..."
python scripts/seed_careers.py
echo "      ✓ Database seeding complete"

# ── Step 3: Start Uvicorn ─────────────────────────────────────────────────────
# exec replaces the shell process so Uvicorn becomes PID 1
# and receives OS signals (SIGTERM) correctly for graceful shutdown.
echo ""
echo "[3/3] Starting Uvicorn server on 0.0.0.0:8000..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2 \
    --log-level info
