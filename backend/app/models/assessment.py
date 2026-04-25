import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base
from sqlalchemy.orm import relationship

class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Store raw json of objective, preference, and subjective answers
    raw_responses = Column(JSONB, nullable=False, default={})
    
    # Store aggregated ML inputs (the 10 features extracted)
    ml_features = Column(JSONB, nullable=True)
    
    # Store ML Output (e.g. { "status": "completed", "predictions": [...] })
    ml_results = Column(JSONB, nullable=True)
    
    status = Column(String, default="pending", index=True) # "pending" or "completed"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
