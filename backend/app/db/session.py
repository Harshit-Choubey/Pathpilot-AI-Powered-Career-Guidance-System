from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

_is_dev = settings.ENVIRONMENT == "development"

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=_is_dev,           # only log SQL in development
    pool_size=10,           # maintain up to 10 connections
    max_overflow=20,        # allow 20 extra burst connections
    pool_pre_ping=True,     # detect stale connections before use
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# Sync engine for Celery tasks (asyncpg → psycopg2 scheme swap)
_sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
sync_engine = create_engine(
    _sync_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
