import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "PathPilot API"
    VERSION: str = "v1"
    
    # Security
    SECRET_KEY: str = "SUPER_SECRET_REPLACE_IN_PRODUCTION"
    
    # External AI
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # CORS — restrict to real origins in production
    # In Docker: overridden by docker-compose BACKEND_CORS_ORIGINS env var (JSON string)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost",          # Nginx on port 80 (Docker)
        "http://localhost:80",
        "http://127.0.0.1",
        "http://localhost:5173",     # Vite dev server (local development)
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "pathpilot"
    DATABASE_URL: str = ""

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # External ML service
    EXT_ML_SERVICE_URL: str = "http://localhost:8001"
    
    # Env
    ENVIRONMENT: str = "development"  # "production" | "development"

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
