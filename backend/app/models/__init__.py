from app.db.base import Base
from app.models.user import User
from app.models.event import EventLog
from app.models.roadmap import RoadmapNode, Task, UserProgress, TaskFeedback
from app.models.assessment import AssessmentResult
from app.models.career import CareerProfile
from app.models.chat import ChatMessage, UserSemanticMemory

# Expose everything to Alembic
__all__ = [
    "Base", "User", "EventLog",
    "RoadmapNode", "Task", "UserProgress", "TaskFeedback",
    "AssessmentResult", "CareerProfile",
    "ChatMessage", "UserSemanticMemory"
]
