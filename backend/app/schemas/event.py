from typing import Optional, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class EventLogCreate(BaseModel):
    event_type: str
    metadata_blob: Optional[Dict[str, Any]] = {}

class EventLogResponse(EventLogCreate):
    id: UUID
    user_id: Optional[UUID]
    created_at: datetime

    class Config:
        from_attributes = True
