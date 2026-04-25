import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class RoadmapNode(Base):
    """
    Represents a core milestone or cluster of skills in the career path.
    Example: 'Python Basics'
    """
    __tablename__ = "roadmap_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Task(Base):
    """
    Leaf nodes on the DAG. Actionable daily steps attached to a RoadmapNode.
    Example: 'Learn Python Lists'
    """
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    node_id = Column(UUID(as_uuid=True), ForeignKey("roadmap_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(50), nullable=True) # e.g., Beginner, Intermediate
    
    # Execution Variables
    estimated_minutes = Column(Integer, default=30)
    due_date = Column(DateTime(timezone=True), nullable=True)
    task_type = Column(String(50), nullable=True) # e.g., 'video', 'project', 'reading', 'quiz'
    energy_level = Column(String(50), nullable=True) # e.g., 'low', 'high'
    
    is_completed = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
