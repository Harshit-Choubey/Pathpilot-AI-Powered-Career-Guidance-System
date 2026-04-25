from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from datetime import datetime
import logging

from app.api.dependencies import get_db, get_current_user
from app.repositories.roadmap import roadmap_repo
from app.schemas.roadmap import RoadmapNodeResponse, TaskResponse
from app.models.user import User
from app.worker.tasks import roadmap_generation_task, monitor_user_velocity

router = APIRouter()

@router.get("/", response_model=List[RoadmapNodeResponse])
async def get_user_roadmap(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the comprehensive Directed Acyclic Graph (DAG) for the current user's career roadmap.
    Nodes are ordered hierarchically, and tasks map directly beneath them.
    """
    nodes = await roadmap_repo.get_roadmap_for_user(db, user_id=current_user.id)
    return nodes

@router.post("/generate")
async def generate_user_roadmap(
    *,
    career_goal: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_career = career_goal.get("career", "Software Developer")
    # Dispatch to Celery
    roadmap_generation_task.delay(str(current_user.id), target_career)
    return {"success": True, "message": "Roadmap Generation dispatched successfully."}


@router.post("/tasks/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    *,
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calculates execution bounds logic: Marks a leaf task as complete, and recursively bubbles
    up completing the parent node if all children tasks are resolved.
    """
    task = await roadmap_repo.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Mark task
    task.is_completed = True
    task.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)
    
    # Execution Engine Bubbling bounds check:
    # If all tasks for the node are completed, mark the node itself as completed
    node = await roadmap_repo.get_node(db, task.node_id)
    if node:
        # Get peers
        from sqlalchemy.future import select
        from app.models.roadmap import Task
        result = await db.execute(select(Task).where(Task.node_id == node.id))
        peer_tasks = result.scalars().all()
        
        all_completed = all(t.is_completed for t in peer_tasks)
        if all_completed and not node.is_completed:
            node.is_completed = True
            await db.commit()
            
    return task

@router.get("/skill-gap", response_model=None)
async def get_skill_gap_analysis(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy.future import select
    from app.models.assessment import AssessmentResult
    
    # Try to find user's latest assessment to get the predicted career
    stmt = select(AssessmentResult).where(AssessmentResult.user_id == current_user.id).order_by(AssessmentResult.created_at.desc())
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    # Use real ML matched Top Career or default
    target = "Software Developer"
    if assessment and assessment.ml_results and "top_matches" in assessment.ml_results:
        target = assessment.ml_results["top_matches"][0]["career"]
        
    # Generate dynamic mock payload based on Target Career
    if target == "Data Scientist":
        mastered = [
            {"name": "Python Programming", "status": "Completed"},
            {"name": "Data Analytics", "status": "Completed"}
        ]
        to_learn = [
            {"name": "Machine Learning", "status": "High Priority", "timeframe": "2-4 months"},
            {"name": "Deep Learning Models", "status": "Moderate Priority", "timeframe": "3-6 months"}
        ]
        courses = [
            {"title": "Machine Learning A-Z", "platform": "Udemy", "rating": 4.8, "hours": 44, "url": "#"},
            {"title": "Deep Learning Specialization", "platform": "Coursera", "rating": 4.9, "hours": 60, "url": "#"}
        ]
    else:
        # Default (Software Developer etc) matching the mockup screenshot
        mastered = [
            {"name": "Programming Fundamentals", "status": "Completed"},
            {"name": "HTML & CSS", "status": "Completed"},
            {"name": "JavaScript Basics", "status": "Completed"},
            {"name": "Git Version Control", "status": "Completed"},
            {"name": "Problem Solving", "status": "Completed"}
        ]
        to_learn = [
            {"name": "React Framework", "status": "High Priority", "description": "Modern frontend library for building user interfaces", "timeframe": "2-3 months"},
            {"name": "Node.js & Backend", "status": "High Priority", "description": "Server-side JavaScript runtime for building APIs", "timeframe": "2-4 months"}
        ]
        courses = [
            {"title": "Complete React Developer Course", "platform": "Udemy", "rating": 4.8, "hours": 40, "url": "#"},
            {"title": "Node.js Backend Masterclass", "platform": "Coursera", "rating": 4.7, "hours": 35, "url": "#"},
            {"title": "SQL & Database Design", "platform": "Pluralsight", "rating": 4.6, "hours": 20, "url": "#"}
        ]

    total = len(mastered) + len(to_learn) + 4 # some arbitrary total
    progress = int((len(mastered) / total) * 100)

    return {
        "target_career": target,
        "progress_percentage": progress,
        "mastered_count": len(mastered),
        "in_progress_count": 3,
        "to_learn_count": len(to_learn),
        "total_skills": total,
        "mastered_skills": mastered,
        "skills_to_learn": to_learn,
        "recommended_courses": courses
    }

@router.post("/adapt")
async def trigger_adaptive_intelligence(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually triggers the ML Adaptive Intelligence System to analyze the user's velocity.
    Normally this fires via a 24-hour Celery Beat cron job.
    """
    # Fire off to Celery 
    monitor_user_velocity.delay(str(current_user.id))
    
    return {"success": True, "message": "Adaptive scan triggered. Tasks will be simplified if velocity is detected as zero."}

@router.get("/portfolio")
async def generate_portfolio(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Builds a Resume-Ready Project Portfolio using Generative AI based on executed DB Nodes.
    """
    from sqlalchemy.future import select
    from app.models.roadmap import Task, RoadmapNode
    import os
    from google import genai as genai_client
    
    # Extract complete tasks under active nodes
    stmt = select(Task).join(RoadmapNode).where(
        RoadmapNode.user_id == current_user.id,
        Task.is_completed == True
    )
    result = await db.execute(stmt)
    completed_tasks = result.scalars().all()
    
    if not completed_tasks:
        return {
            "success": True,
            "portfolio": "You have not completed any actionable tasks. Execute your daily plan to generate resume bullet points."
        }
        
    task_strings = [f"- {t.title} (Difficulty: {t.difficulty})" for t in completed_tasks]
    context_str = "\n".join(task_strings)
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
         return {
            "success": True,
            "portfolio": f"**Current Accomplishments**\n\n{context_str}\n\n*(Note: Configure GEMINI_API_KEY to synthesize this into professional resume bullet points)*"
        }
        
    client = genai_client.Client(api_key=api_key)
    sys_prompt = (
        "You are a professional Executive Recruiter. Take the exact list of tasks the user completed "
        "and synthesize them into 3 highly professional Resume Bullet points focused on outcomes. "
        "Format it in Markdown. Be concise."
    )
    full_prompt = f"{sys_prompt}\n\nHere is what I have learned/built recently:\n{context_str}"
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )
        portfolio_output = response.text
    except Exception as e:
        logging.getLogger("pathpilot").error(f"Portfolio generation error: {e}")
        portfolio_output = f"Failed to generate AI portfolio. Raw tasks:\n{context_str}"
        
    return {
        "success": True,
        "portfolio": portfolio_output
    }
