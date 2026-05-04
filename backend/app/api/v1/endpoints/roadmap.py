from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from datetime import datetime
import logging
import json
import os

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
    language = career_goal.get("language", "en")
    # Dispatch to Celery with language context
    roadmap_generation_task.delay(str(current_user.id), target_career, language)
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


@router.post("/translate")
async def translate_roadmap(
    *,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    On-the-fly translation of the user's stored roadmap.
    Accepts { "language": "hi" | "mr" } and returns the full roadmap
    with all text fields translated by the LLM. Content is NOT stored
    back to the DB — English remains the source of truth.
    """
    import httpx
    from sqlalchemy.future import select
    from app.models.roadmap import RoadmapNode, Task

    language = body.get("language", "en")
    if language == "en":
        # Just return the normal roadmap
        nodes = await roadmap_repo.get_roadmap_for_user(db, user_id=current_user.id)
        from app.schemas.roadmap import RoadmapNodeResponse
        return [n.__dict__ for n in nodes]

    LANGUAGE_NAMES = {"hi": "Hindi", "mr": "Marathi"}
    language_name = LANGUAGE_NAMES.get(language, "Hindi")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI translation engine offline.")

    # 1. Fetch user's full roadmap from DB
    stmt = select(RoadmapNode).where(RoadmapNode.user_id == current_user.id).order_by(RoadmapNode.created_at)
    result = await db.execute(stmt)
    nodes = result.scalars().all()

    if not nodes:
        return []

    # 2. Build a compact JSON representation of what needs translating
    compact = []
    for node in nodes:
        task_stmt = select(Task).where(Task.node_id == node.id).order_by(Task.order_index)
        task_res = await db.execute(task_stmt)
        tasks = task_res.scalars().all()
        compact.append({
            "id": str(node.id),
            "title": node.title,
            "description": node.description or "",
            "tasks": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "expected_outcome": t.expected_outcome or "",
                    "validation_criteria": t.validation_criteria or "",
                    "action_steps": json.loads(t.action_steps) if t.action_steps else [],
                    # Pass-through fields (not translated)
                    "difficulty": t.difficulty,
                    "estimated_minutes": t.estimated_minutes,
                    "task_type": t.task_type,
                    "order_index": t.order_index,
                    "project_linked": t.project_linked,
                    "skill_tags": json.loads(t.skill_tags) if t.skill_tags else [],
                    "xp_reward": t.xp_reward,
                    "resources": json.loads(t.resources) if t.resources else [],
                    "is_completed": t.is_completed,
                    "node_id": str(node.id),
                }
                for t in tasks
            ]
        })

    # 3. Ask Groq to translate all text fields
    translation_prompt = (
        f"You are a professional translator. Translate ALL human-readable text values in the following JSON into {language_name}.\n"
        f"Rules:\n"
        f"- Keep ALL JSON keys exactly as-is (do NOT translate keys).\n"
        f"- Keep enum values exactly as-is: 'Beginner', 'Intermediate', 'Advanced', 'video', 'reading', 'practice', 'project', 'quiz', 'assignment', 'self-check'.\n"
        f"- Keep all UUIDs, numbers, booleans exactly as-is.\n"
        f"- Translate: title, description, expected_outcome, validation_criteria, and each string inside action_steps arrays.\n"
        f"- Output ONLY the translated JSON array. No explanation, no markdown fences.\n\n"
        f"{json.dumps(compact, ensure_ascii=False)}"
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": translation_prompt}],
                    "max_tokens": 8192,
                    "temperature": 0.1,
                }
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        translated = json.loads(raw)
        return translated

    except httpx.HTTPStatusError as e:
        logger.error(f"Groq translation error: {e.response.status_code}")
        raise HTTPException(status_code=502, detail="Translation service error.")
    except json.JSONDecodeError as e:
        logger.error(f"Translation JSON parse failed: {e}")
        raise HTTPException(status_code=502, detail="Translation returned invalid JSON.")
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail="Translation failed.")


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
