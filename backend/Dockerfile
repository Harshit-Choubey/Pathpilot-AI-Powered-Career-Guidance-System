# ─────────────────────────────────────────────────────────────────────────────
# PathPilot Backend Dockerfile
# Python 3.11-slim | FastAPI + Uvicorn + Celery + Alembic
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# Prevent .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
# gcc          : compile some Python C extensions
# libpq-dev    : psycopg2 native bindings
# curl         : used by Docker healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies (own layer for caching) ───────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# ── Application code ──────────────────────────────────────────────────────────
COPY . .

# ── Runtime directories ───────────────────────────────────────────────────────
RUN mkdir -p /app/uploads /app/logs

# ── Make startup script executable ───────────────────────────────────────────
RUN chmod +x prestart.sh

EXPOSE 8000

# Default: run the prestart script (migrations → uvicorn)
# Celery worker overrides this CMD in docker-compose.yml
CMD ["bash", "prestart.sh"]
