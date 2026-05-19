# =============================================================================
# PathPilot ML Service Dockerfile
# Python 3.11-slim | FastAPI + scikit-learn + XGBoost + SHAP
# Models are baked into the image at build time (included in zip/repo).
# =============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# ── System dependencies ───────────────────────────────────────────────────────
# gcc    : required to compile XGBoost C extensions on slim images
# curl   : required for Docker healthcheck probe
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        curl \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies (own layer for caching) ───────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# ── Application code + ML models ─────────────────────────────────────────────
# Models (~70MB) are included in the build context.
# They are loaded at startup via the FastAPI lifespan event.
COPY . .

EXPOSE 8001

# exec ensures uvicorn is PID 1 and handles SIGTERM gracefully
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
