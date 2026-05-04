# PathPilot: Comprehensive Technical Documentation 📖

Welcome to the ultimate technical manual for **PathPilot** — an AI-Powered Career Execution Operating System. This document covers every single functionality, architecture choice, and API reference for the platform.

---

## 🔗 Important System Links
Once the system is running, you can monitor the health and interact with documentation directly through these links:

* **Web Application:** [http://localhost:5173](http://localhost:5173)
* **Backend API Swagger Docs:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) *(Monitor all endpoints, test JWT auth directly)*
* **Backend Health Status:** [http://localhost:8000/health](http://localhost:8000/health)
* **ML Service API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs) *(Interact directly with the XGBoost/Ensemble predictor)*
* **ML Service Health Status:** [http://localhost:8001/health](http://localhost:8001/health)

---

## 🌟 Complete Feature List

PathPilot is designed to guide a user from absolute uncertainty to career mastery. Here is every major functionality built into the system:

### 1. Secure Authentication & User Management
* **JWT-Based Auth:** Secure token generation (`access_token`) using OAuth2 Password Bearer.
* **HttpOnly Persistence:** Secure state handling on the frontend with automatic session timeouts and token refresh strategies.
* **Semantic Memory Profile:** The system stores an ongoing profile of the user's weaknesses and strengths extracted from conversations.

### 2. Psychometric Assessment Pipeline
* **Iterative Form:** A multi-step UI form that captures inclinations, soft skills, technical abilities, and work-style preferences.
* **Asynchronous Processing:** The assessment payload is offloaded to a **Celery Background Worker**, which communicates with the ML Service.
* **Soft-Voting Ensemble Engine:** An isolated ML service uses LightGBM and XGBoost models (loaded via `.joblib`) to score the user against 15+ potential career trajectories.

### 3. Hybrid AI Decision Engine (The AI Mentor)
* **Intent Routing System:** Parses natural language to determine if a user is `comparing`, `rejecting`, or `exploring` careers.
* **State Management:** If a user rejects a career, it is permanently logged in the PostgreSQL `UserDecisionState` table and blacklisted from future recommendations.
* **Contextual Prompt Injection:** The system compresses the user's exact UI state (what careers they are looking at) and injects it into the LLM system prompt.
* **Fast LLM Generation:** Uses Groq (`llama-3.1-8b-instant`) to generate empathetic, highly structured mentorship advice without hallucinating career statistics.

### 4. Generative Career Roadmaps
* **Milestone Generation:** Once a user "Locks" a career, the system queries the LLM to generate a customized, multi-phase curriculum tailored to their exact assessment weaknesses.
* **Strict JSON Parsing:** Uses Pydantic Structured Outputs to guarantee the LLM returns perfect JSON nodes.

### 5. Gamified Dashboard & Execution Tracking
* **Task Management:** Users can track their daily missions and check off curriculum nodes.
* **Velocity Metrics:** The system calculates XP and streak data based on the frequency and difficulty of completed tasks.
* **Real-time State Syncing:** The React frontend automatically polls and syncs progress metrics.

---

## 🏗️ System Architecture

PathPilot is built on a highly scalable, decoupled microservice architecture. All backend services are containerized and orchestrated via **Docker Compose**.

### Architecture Diagram

```mermaid
graph TD
    Client[Web Browser] -->|HTTP / API Requests| Frontend[React / Vite Container]
    Frontend -->|REST API| Backend[FastAPI Backend]
    
    subquery[Background Processing]
    Backend -->|Queues Task| CeleryBroker[(Redis: Broker)]
    CeleryBroker --> CeleryWorker[Celery Worker Container]
    CeleryWorker -->|Predict Request| MLService[ML Inference FastAPI]
    CeleryWorker -->|Updates Status| DB[(PostgreSQL)]
    end
    
    Backend -->|Read / Write| DB
    Backend -->|Rate Limiting| CeleryBroker
    Backend -->|LLM Prompts| GroqAPI[Groq API: llama-3.1-8b]
```

### Component Breakdown
1. **Frontend Client (`frontend/`)**: React 18, Vite, Tailwind CSS. Containerized via Node Alpine.
2. **Core API Backend (`backend/`)**: FastAPI, SQLAlchemy (asyncpg), PostgreSQL. Handles user state and auth.
3. **Task Runner (`celery_worker/`)**: Offloads heavy AI/ML routing to keep the web server responsive.
4. **ML Inference Service (`ml-service/`)**: Isolated API just for running `.joblib` model predictions.
5. **Database Initialization**: `prestart.sh` automatically runs Alembic migrations on boot to create all PostgreSQL schemas.

---

## ⚙️ Core Data Flows

### 1. Assessment Flow
* The User takes the 55-question assessment.
* The frontend aggregates the payload and posts it to `/api/v1/assessment/submit`.
* Core Backend creates a DB entry with `status="processing"`, queues a Celery Task (`ml_inference_task`), and returns a `202 Accepted` response.
* Frontend kicks off a 4s polling loop on `/api/v1/assessment/history`.
* Celery hits the ML-Service at `http://ml_service:8001/predict`, receives predictions, and updates the PostgreSQL database.
* Frontend sees `status="completed"` and instantly transitions the user to the Career Results page.

---

## 🗝️ Environment Variables & Secrets

The system relies on variables defined in `backend/.env`. Ensure your `.env` contains:

* `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` - Controls PostgreSQL initialization.
* `GROQ_API_KEY` - **Mandatory** for the AI Mentor and Roadmap Generation features.
* `SECRET_KEY` - Used for signing JWT authentication tokens. 
* `DATABASE_URL` - The internal docker routing string pointing to the `db` service.

---

## 🔧 Extending the Platform

* **To Add a New API Endpoint:** Create the router logic inside `backend/app/api/v1/endpoints/` and register it in `backend/app/api/v1/api.py`.
* **To Retrain ML Models:** Navigate to `ml-service/`, place your new dataset CSV inside `ml-service/data`, and run `python scripts/train_model.py`. The resulting `.joblib` files will automatically overwrite the old models.
