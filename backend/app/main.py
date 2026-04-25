import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

# ── Structured Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("pathpilot")

# ── Request-ID Middleware ────────────────────────────────────────────────────
class RequestIDMiddleware(BaseHTTPMiddleware):
    """Stamps every request/response with a unique X-Request-ID for tracing."""
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

# ── Redis Rate Limiter lifespan ───────────────────────────────────────────────
from redis.asyncio import Redis
from fastapi_limiter import FastAPILimiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        redis_conn = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_conn)
        logger.info("Redis rate limiter initialized.")
    except Exception as e:
        logger.warning(f"Redis unavailable — rate limiting disabled. Reason: {e}")
    yield
    try:
        await redis_conn.close()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PathPilot FastAPI Backend — AI-Powered Career Execution OS",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(RequestIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Global Exception Handlers ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        f"Unhandled exception | request_id={request_id} | path={request.url.path} | error={exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An internal server error occurred.",
            "request_id": request_id,
        },
    )

# ── Routes ────────────────────────────────────────────────────────────────────
from app.api.v1.api import api_router
app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def root():
    return {
        "success": True,
        "data": {"message": "PathPilot API is up and running"},
        "error": None,
        "meta": {"version": settings.VERSION, "env": settings.ENVIRONMENT},
    }
