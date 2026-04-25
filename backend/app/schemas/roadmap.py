from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    difficulty: Optional[str] = None
    estimated_minutes: int = 30
    task_type: Optional[str] = None
    energy_level: Optional[str] = None
    is_completed: bool = False

class TaskResponse(TaskBase):
    id: UUID
    node_id: UUID
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RoadmapNodeBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_completed: bool = False

class RoadmapNodeResponse(RoadmapNodeBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True

class SkillItem(BaseModel):
    name: str
    status: str # "Completed", "High Priority", "Moderate Priority"
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
