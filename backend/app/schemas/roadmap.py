from typing import Optional, List, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# ── Task Schemas ─────────────────────────────────────────────────────────────

class TaskResponse(BaseModel):
    id: UUID
    node_id: UUID
    title: str
    difficulty: Optional[str] = "Beginner"
    task_type: Optional[str] = "reading"
    estimated_minutes: int = 30
    order_index: int = 0

    # Rich execution fields
    action_steps: Optional[str] = None       # JSON string → list on frontend
    expected_outcome: Optional[str] = None
    validation_type: Optional[str] = None
    validation_criteria: Optional[str] = None
    resources: Optional[str] = None         # JSON string → list on frontend
    skill_tags: Optional[str] = None        # JSON string → list on frontend

    # Gamification
    xp_reward: int = 10
    project_linked: bool = False

    # State
    is_completed: bool = False
    energy_level: Optional[str] = "medium"
    last_feedback: Optional[str] = None
    skip_count: int = 0
    is_accelerated: bool = False
    is_injected: bool = False

    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── RoadmapNode Schemas ───────────────────────────────────────────────────────

class RoadmapNodeResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str] = None
    is_completed: bool = False
    phase_number: int = 1
    xp_reward: int = 100
    is_locked: bool = False
    unlock_xp_required: int = 0
    created_at: datetime
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True


# ── Progress Schemas ──────────────────────────────────────────────────────────

class UserProgressResponse(BaseModel):
    total_xp: int = 0
    level: int = 1
    level_title: str = "Career Explorer"
    xp_to_next_level: int = 200
    current_streak: int = 0
    longest_streak: int = 0
    tasks_completed: int = 0
    projects_completed: int = 0
    badges: List[str] = []


class FeedbackRequest(BaseModel):
    task_id: UUID
    feedback: str               # easy | medium | hard
    time_taken_minutes: Optional[int] = None


class SkillProgressItem(BaseModel):
    skill: str
    total_tasks: int
    completed_tasks: int
    percentage: float


class DailyMissionResponse(BaseModel):
    tasks: List[TaskResponse]
    total_xp_available: int
    message: str


# ── Skill Gap Schemas (kept for backward compat) ──────────────────────────────

class SkillItem(BaseModel):
    name: str
    status: str
    description: Optional[str] = None
    timeframe: Optional[str] = None


class CourseItem(BaseModel):
    title: str
    platform: str
    rating: float
    hours: int
    url: str


class SkillGapResponse(BaseModel):
    target_career: str
    progress_percentage: int
    mastered_count: int
    in_progress_count: int
    to_learn_count: int
    total_skills: int
    mastered_skills: List[SkillItem]
    skills_to_learn: List[SkillItem]
    recommended_courses: List[CourseItem]
