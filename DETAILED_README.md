# Detailed Documentation - PathPilot

This document outlines the architecture, data models, services, and core flows of the PathPilot platform.

## 🏗️ System Architecture

PathPilot is comprised of a decoupled microservice architecture orchestrated via Docker Compose for backend services, and a standalone Vite/React frontend.

### 1. Frontend Client (`frontend/`)
* **Tech Stack**: React 18, Vite, Tailwind CSS, React Router v6, Axios
* **Features**: 
    * Glassmorphic UI tailored for modern web apps.
    * 4-Stage iterative psychometric assessment form.
    * Real-time dashboard with dynamic fetching.
    * Secure interceptor-based JWT handling with auto-logout features.

### 2. Core API Backend (`backend/`)
* **Tech Stack**: FastAPI (Python 3.11), SQLAlchemy 2.0 (asyncpg), PostgreSQL, Pydantic v2
* **Role**: Serves all REST endpoints for user authentication, assessment recording, task tracking, and Generative AI integrations.
* **Database**: Uses `asyncpg` for high-concurrency API calls, and standard `psycopg2` via synchronous engine for Celery tasks.

### 3. Background Task Runner (`celer_worker/` running inside `backend/`)
* **Tech Stack**: Celery, Redis (Broker/Backend)
* **Role**: Handles heavy loads decoupling them from the fast web requests.
* **Tasks**:
    * Pinging the ML Inference Service.
    * Aggregating "Velocity" events.
    * Generating Gemini AI Roadmaps.

### 4. Machine Learning Inference Service (`ml-service/`)
* **Tech Stack**: FastAPI, Scikit-Learn, XGBoost, LightGBM
* **Features**: 
    * Soft-voting ensemble model loaded via `.joblib` files.
    * Isolated microservice to guarantee standard REST interfacing (avoiding large ML package bloat in the main API).
* **Endpoints**: `/predict`, `/explain`.

## ⚙️ How Data Flows

**1. Assessment Flow:**
* The User takes a 55-question assessment.
* The frontend aggregates this into an object and posts it to `/assessment/submit`.
* Core Backend creates a DB entry with `status="processing"`, queues a Celery Task (`ml_inference_task`), and returns an immediate response.
* Frontend kicks off a 4s polling loop on `/assessment/history`.
* Celery hits the ML-Service at `http://ml_service:8001/predict` and updates the DB with predictions.
* Frontend sees `status="completed"` and transitions the user to their results.

**2. Roadmap Generation Flow:**
* User "Locks" a career on the dashboard.
* Core Backend triggers a call to Google's Gemini Models via the `google.genai` SDK.
* The response is parsed into JSON nodes using a strictly validated Pydantic Structured Output schema.
* Displayed dynamically on the user's dashboard.

## 🗝️ Environment Variables

The system relies on variables defined in `backend/.env`:
* `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` - Controls DB initialization.
* `GEMINI_API_KEY` - Mandatory for AI features.
* `SECRET_KEY` - JWT signing key. 
* `DATABASE_URL` - Internal docker routing strings point to the `db` service.

## 🔧 Extending the Platform

* **To add a new Endpoint:** Add the router inside `backend/app/api/v1/endpoints/` and register it in `api.py`.
* **To retrain ML Models:** Enter `ml-service/`, install requirements locally, place your new dataset data inside `ml-service/data`, and run `python scripts/train_model.py`. The `.joblib` files will automatically overwrite.
* **Styling:** CSS variables and configuration live in `frontend/tailwind.config.js` and `frontend/index.css`.
