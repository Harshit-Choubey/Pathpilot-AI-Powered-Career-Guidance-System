import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    metadata_blob = Column(JSONB, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
