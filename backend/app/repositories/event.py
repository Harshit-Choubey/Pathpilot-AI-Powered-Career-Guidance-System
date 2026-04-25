from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import EventLog
from app.schemas.event import EventLogCreate
from uuid import UUID

class EventLogRepository:
    async def create(self, db: AsyncSession, obj_in: EventLogCreate, user_id: UUID = None) -> EventLog:
        db_obj = EventLog(
            user_id=user_id,
            event_type=obj_in.event_type,
            metadata_blob=obj_in.metadata_blob
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

event_repo = EventLogRepository()
