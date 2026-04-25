from fastapi import APIRouter, Depends
from typing import Optional

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.assessment import AssessmentResult
from app.schemas.assessment import AssessmentSubmission, AssessmentResponse, AssessmentHistoryResponse
from app.worker.tasks import ml_inference_task
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

router = APIRouter()

@router.post("/submit", response_model=AssessmentResponse)
async def submit_assessment(
    *,
    assessment_in: AssessmentSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits an assessment, saves raw responses to the database, and queues the ML Inference task.
    """
    # Create DB Record
    db_obj = AssessmentResult(
        user_id=current_user.id,
        raw_responses=assessment_in.answers,
        status="processing"
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    # System queues Celery task ml_inference_task
    task = ml_inference_task.delay(
        assessment_id=str(db_obj.id),
        user_id=str(current_user.id), 
        assessment_data=assessment_in.answers
    )
    
    return AssessmentResponse(
        success=True,
        data={
            "assessment_id": str(db_obj.id),
            "task_id": task.id,
            "status": "processing"
        }
    )

@router.get("/history", response_model=AssessmentHistoryResponse)
async def get_assessment_history(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the user's past assessment submissions and their ML status.
    """
    query = select(AssessmentResult).where(AssessmentResult.user_id == current_user.id).order_by(AssessmentResult.created_at.desc())
    result = await db.execute(query)
    assessments = result.scalars().all()
    
    history_items = []
    for a in assessments:
        history_items.append({
            "id": str(a.id),
            "created_at": a.created_at,
            "status": a.status,
            "ml_results": a.ml_results
        })
        
    return AssessmentHistoryResponse(success=True, history=history_items)
