import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import enum

class RoleEnum(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    SYSTEM = "SYSTEM"
    MOD = "MOD"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER, nullable=False)
    is_active = Column(Boolean(), default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
