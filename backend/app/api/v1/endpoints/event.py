from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
import datetime

from app.api.dependencies import get_db, get_current_user
from app.repositories.event import event_repo
from app.schemas.event import EventLogCreate, EventLogResponse
from app.models.user import User

router = APIRouter()

@router.post("/track", response_model=EventLogResponse)
async def track_event(
    *,
    db: AsyncSession = Depends(get_db),
    event_in: EventLogCreate,
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Log an event into the Data Warehouse for Product Analytics and ML Feedback loops.
    """
    user_id = current_user.id if current_user else None
    
    # In extremely high-scale environments, we would drop this on a Kafka topic 
    # or Celery queue instead of direct Postgres insert, but this handles scale out of the box nicely.
    event_obj = await event_repo.create(db, obj_in=event_in, user_id=user_id)
    return event_obj

@router.get("/analytics")
async def get_execution_analytics(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate daily execution velocity (minutes) for the last 7 days
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    # Use text() with bound params to prevent any SQL injection risk
    stmt = text("""
        SELECT date(created_at) as day,
               sum(cast(metadata_blob->>'duration_minutes' as integer)) as total_minutes
        FROM event_logs
        WHERE user_id = :uid
          AND event_type = 'task_completed'
          AND created_at >= :since
        GROUP BY date(created_at)
        ORDER BY date(created_at)
    """)
    result = await db.execute(stmt, {"uid": str(current_user.id), "since": seven_days_ago})
    rows = result.fetchall()
    
    # Map the last 7 days explicitly so days with 0 activity still appear
    today = datetime.datetime.utcnow().date()
    row_map = {row.day: row.total_minutes for row in rows}
    velocity = []
    
    for i in range(6, -1, -1):
        target_date = today - datetime.timedelta(days=i)
        minutes = row_map.get(target_date, 0)
        velocity.append({
            "date": target_date.strftime("%b %d"),
            "minutes": minutes or 0
        })
        
    return {
        "success": True,
        "analytics": {
            "weekly_velocity_data": velocity,
            "total_minutes_all_time": sum(r.total_minutes for r in rows if r.total_minutes)
        }
    }
