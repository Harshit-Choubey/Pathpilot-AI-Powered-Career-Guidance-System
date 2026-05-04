import uuid
import json
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Float, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.db.base import Base


class RoadmapNode(Base):
    """
    Represents a phase/milestone in the adaptive career roadmap.
    Phases unlock progressively as XP thresholds are met.
    """
    __tablename__ = "roadmap_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)

    # Adaptive system fields
    phase_number = Column(Integer, default=1)         # ordering: 1, 2, 3, 4
    xp_reward = Column(Integer, default=100)          # XP on phase completion
    is_locked = Column(Boolean, default=False)        # progressive unlock
    unlock_xp_required = Column(Integer, default=0)  # XP needed to unlock

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tasks = relationship("Task", back_populates="node", cascade="all, delete-orphan", lazy="select",
                         order_by="Task.order_index")


class Task(Base):
    """
    Atomic, actionable learning unit. Each task has explicit action steps,
    validation criteria, and XP rewards. Designed for adaptive reordering.
    """
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    node_id = Column(UUID(as_uuid=True), ForeignKey("roadmap_nodes.id", ondelete="CASCADE"),
                     nullable=False, index=True)

    # Core fields
    title = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="Beginner")   # Beginner / Intermediate / Advanced
    task_type = Column(String(50), default="reading")     # video | reading | practice | project | quiz
    estimated_minutes = Column(Integer, default=30)
    order_index = Column(Integer, default=0)              # for dynamic reordering

    # Execution layer — rich task design
    action_steps = Column(Text, nullable=True)            # JSON array of step strings
    expected_outcome = Column(Text, nullable=True)        # what user achieves
    validation_type = Column(String(50), nullable=True)   # quiz | assignment | project | self-check
    validation_criteria = Column(Text, nullable=True)     # how success is measured
    resources = Column(Text, nullable=True)               # JSON array [{title, url, type}]

    # Skill & gamification
    skill_tags = Column(Text, nullable=True)              # JSON array ["SQL", "Data Analysis"]
    xp_reward = Column(Integer, default=10)               # +10 task, +50 project
    project_linked = Column(Boolean, default=False)       # is this a portfolio project?

    # State
    is_completed = Column(Boolean, default=False)
    energy_level = Column(String(50), default="medium")   # low | medium | high
    due_date = Column(DateTime(timezone=True), nullable=True)

    # Adaptive feedback
    last_feedback = Column(String(20), nullable=True)     # easy | medium | hard
    skip_count = Column(Integer, default=0)               # times user skipped
    is_accelerated = Column(Boolean, default=False)       # AI-marked as skippable
    is_injected = Column(Boolean, default=False)          # AI-inserted foundational task

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    node = relationship("RoadmapNode", back_populates="tasks")
    feedbacks = relationship("TaskFeedback", back_populates="task", cascade="all, delete-orphan")


class UserProgress(Base):
    """
    Tracks gamification state: XP, streaks, level, badges.
    One record per user — upserted on activity.
    """
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, unique=True, index=True)

    # XP & Level
    total_xp = Column(Integer, default=0)
    level = Column(Integer, default=1)          # computed: every 200 XP = 1 level
    level_title = Column(String(100), default="Career Explorer")

    # Streaks
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True), nullable=True)

    # Achievements
    badges = Column(Text, default="[]")         # JSON array of badge keys
    tasks_completed = Column(Integer, default=0)
    projects_completed = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TaskFeedback(Base):
    """
    Records user's difficulty rating after each task.
    Powers the adaptive engine to reorder/inject tasks.
    """
    __tablename__ = "task_feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)

    feedback = Column(String(20), nullable=False)       # easy | medium | hard
    time_taken_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    task = relationship("Task", back_populates="feedbacks")
