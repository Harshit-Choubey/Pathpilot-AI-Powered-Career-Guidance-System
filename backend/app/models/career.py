import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base import Base

class CareerProfile(Base):
    __tablename__ = "career_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=True) # e.g., "Technology", "Design"
    description = Column(String, nullable=True)
    
    # Quantitative Metadata
    salary_range = Column(String(50), nullable=True) # e.g., "₹6-15 LPA"
    job_growth_percentage = Column(String(50), nullable=True) # "22% by 2030"
    time_to_start = Column(String(50), nullable=True) # "6-12 months"
    experience_level = Column(String(50), nullable=True) # "Entry Level"
    
    # Qualitative Metadata (Stored as JSON Arrays)
    advantages = Column(JSONB, default=[]) # ["High earning potential", "Remote work"]
    challenges = Column(JSONB, default=[]) # ["Requires constant upskilling", "Sedentary work"]
    required_skills = Column(JSONB, default=[]) # ["Python", "Analytic Thinking"]
    tags = Column(JSONB, default=[]) # ["Technology", "High Growth"]

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
