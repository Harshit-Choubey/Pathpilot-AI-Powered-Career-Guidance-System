"""
Progress & Gamification API
Handles: XP, Streaks, Badges, Daily Missions, Skill Graph, Task Feedback
"""
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.models.roadmap import RoadmapNode, Task, UserProgress, TaskFeedback
from app.schemas.roadmap import (
    UserProgressResponse, FeedbackRequest,
    DailyMissionResponse, SkillProgressItem, TaskResponse
)

logger = logging.getLogger("pathpilot")
router = APIRouter()

# ── Level System ──────────────────────────────────────────────────────────────

LEVEL_TITLES = {
    1: "Career Explorer", 2: "Skill Builder", 3: "Knowledge Seeker",
    4: "Domain Apprentice", 5: "Competent Practitioner", 6: "Rising Professional",
    7: "Domain Expert", 8: "Strategic Thinker", 9: "Industry Leader", 10: "Career Master"
}

def compute_level(xp: int) -> tuple[int, str, int]:
    """Returns (level, title, xp_to_next_level)"""
    level = max(1, min(10, (xp // 200) + 1))
    title = LEVEL_TITLES.get(level, "Career Master")
    xp_to_next = (level * 200) - xp if level < 10 else 0
    return level, title, max(0, xp_to_next)


async def get_or_create_progress(db: AsyncSession, user_id: UUID) -> UserProgress:
    result = await db.execute(select(UserProgress).where(UserProgress.user_id == user_id))
    progress = result.scalars().first()
    if not progress:
        progress = UserProgress(user_id=user_id)
        db.add(progress)
        await db.commit()
        await db.refresh(progress)
    return progress


async def update_streak(progress: UserProgress, db: AsyncSession):
    """Update streak based on last_activity_date."""
    now = datetime.now(timezone.utc)
    today = now.date()

    if progress.last_activity_date:
        last_date = progress.last_activity_date
        if hasattr(last_date, 'date'):
            last_date = last_date.date()
        diff = (today - last_date).days
        if diff == 0:
            pass  # same day, no change
        elif diff == 1:
            progress.current_streak += 1
        else:
            progress.current_streak = 1  # streak broken
    else:
        progress.current_streak = 1

    if progress.current_streak > progress.longest_streak:
        progress.longest_streak = progress.current_streak

    progress.last_activity_date = now
    await db.commit()


# ── GET /progress/ ─────────────────────────────────────────────────────────────

@router.get("/", response_model=UserProgressResponse)
async def get_user_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current XP, level, streak, badges for the authenticated user."""
    progress = await get_or_create_progress(db, current_user.id)
    level, title, xp_to_next = compute_level(progress.total_xp)

    badges = []
    try:
        badges = json.loads(progress.badges or "[]")
    except Exception:
        pass

    return UserProgressResponse(
        total_xp=progress.total_xp,
        level=level,
        level_title=title,
        xp_to_next_level=xp_to_next,
        current_streak=progress.current_streak,
        longest_streak=progress.longest_streak,
        tasks_completed=progress.tasks_completed,
        projects_completed=progress.projects_completed,
        badges=badges,
    )


# ── POST /progress/feedback ────────────────────────────────────────────────────

@router.post("/feedback")
async def submit_task_feedback(
    payload: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Record Easy/Medium/Hard feedback after task completion.
    Awards XP, updates streak, triggers adaptive engine if needed.
    """
    # 1. Get task
    task_result = await db.execute(select(Task).where(Task.id == payload.task_id))
    task = task_result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Mark task complete if not already
    if not task.is_completed:
        task.is_completed = True
        task.completed_at = datetime.now(timezone.utc)

    task.last_feedback = payload.feedback

    # 3. Record feedback
    feedback = TaskFeedback(
        task_id=payload.task_id,
        user_id=current_user.id,
        feedback=payload.feedback,
        time_taken_minutes=payload.time_taken_minutes,
    )
    db.add(feedback)

    # 4. Award XP
    progress = await get_or_create_progress(db, current_user.id)
    xp_earned = task.xp_reward or 10
    progress.total_xp += xp_earned
    progress.tasks_completed += 1
    if task.project_linked:
        progress.projects_completed += 1

    # 5. Update streak
    await update_streak(progress, db)

    # 6. Badge logic
    badges = []
    try:
        badges = json.loads(progress.badges or "[]")
    except Exception:
        pass

    if progress.tasks_completed == 1 and "first_task" not in badges:
        badges.append("first_task")
    if progress.current_streak >= 7 and "week_streak" not in badges:
        badges.append("week_streak")
    if progress.projects_completed >= 1 and "first_project" not in badges:
        badges.append("first_project")
    if progress.total_xp >= 500 and "xp_500" not in badges:
        badges.append("xp_500")

    progress.badges = json.dumps(badges)

    # 7. Check if we should trigger adaptive engine (every 3 feedbacks)
    feedback_count_result = await db.execute(
        select(func.count(TaskFeedback.id)).where(TaskFeedback.user_id == current_user.id)
    )
    total_feedbacks = feedback_count_result.scalar() or 0

    await db.commit()

    # 8. Trigger adaptive engine every 3 feedbacks
    if total_feedbacks % 3 == 0:
        try:
            from app.worker.tasks import adaptive_engine_task
            adaptive_engine_task.delay(str(current_user.id))
        except Exception as e:
            logger.warning(f"Adaptive engine trigger failed: {e}")

    level, title, xp_to_next = compute_level(progress.total_xp)

    return {
        "success": True,
        "xp_earned": xp_earned,
        "total_xp": progress.total_xp,
        "level": level,
        "level_title": title,
        "current_streak": progress.current_streak,
        "badges_earned": badges,
        "message": f"+{xp_earned} XP earned! 🎯"
    }


# ── GET /progress/daily-mission ────────────────────────────────────────────────

@router.get("/daily-mission", response_model=DailyMissionResponse)
async def get_daily_mission(
    available_minutes: int = 120,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI-selected daily mission tasks based on:
    1. Weak skill areas (hard feedback)
    2. Available time budget
    3. Sequential progression
    Always includes 1 project task if available.
    """
    # Get all roadmap nodes for user
    nodes_result = await db.execute(
        select(RoadmapNode)
        .where(RoadmapNode.user_id == current_user.id)
        .order_by(RoadmapNode.phase_number)
    )
    nodes = nodes_result.scalars().all()

    if not nodes:
        return DailyMissionResponse(tasks=[], total_xp_available=0,
                                    message="Generate your roadmap first!")

    # Get all pending tasks (not completed, not accelerated)
    node_ids = [n.id for n in nodes]
    tasks_result = await db.execute(
        select(Task)
        .where(Task.node_id.in_(node_ids), Task.is_completed == False,
               Task.is_accelerated == False)
        .order_by(Task.node_id, Task.order_index)
    )
    all_pending = tasks_result.scalars().all()

    if not all_pending:
        return DailyMissionResponse(tasks=[], total_xp_available=0,
                                    message="🎉 All tasks completed! Regenerate for more challenges.")

    # Find weak skill tags from recent hard feedbacks
    hard_feedbacks_result = await db.execute(
        select(TaskFeedback.task_id)
        .where(TaskFeedback.user_id == current_user.id, TaskFeedback.feedback == "hard")
        .order_by(TaskFeedback.created_at.desc())
        .limit(10)
    )
    hard_task_ids = [row[0] for row in hard_feedbacks_result.fetchall()]

    weak_skill_tags = set()
    if hard_task_ids:
        hard_tasks_result = await db.execute(
            select(Task.skill_tags).where(Task.id.in_(hard_task_ids))
        )
        for row in hard_tasks_result.fetchall():
            if row[0]:
                try:
                    tags = json.loads(row[0])
                    weak_skill_tags.update(tags)
                except Exception:
                    pass

    # Priority queue: weak-area tasks first, then sequential
    priority_tasks = []
    normal_tasks = []
    project_tasks = []

    for task in all_pending:
        if task.project_linked:
            project_tasks.append(task)
            continue
        task_tags = set()
        if task.skill_tags:
            try:
                task_tags = set(json.loads(task.skill_tags))
            except Exception:
                pass
        if weak_skill_tags & task_tags:
            priority_tasks.append(task)
        else:
            normal_tasks.append(task)

    # Build mission: priority → normal → 1 project
    selected = []
    time_budget = available_minutes

    for task in priority_tasks + normal_tasks:
        if time_budget <= 0 or len(selected) >= 3:
            break
        if task.estimated_minutes <= time_budget:
            selected.append(task)
            time_budget -= task.estimated_minutes

    # Always try to add 1 project task
    if project_tasks and len(selected) < 4:
        pt = project_tasks[0]
        if pt.estimated_minutes <= time_budget or not selected:
            selected.append(pt)

    total_xp = sum(t.xp_reward or 10 for t in selected)

    msg = f"🎯 {len(selected)} missions selected"
    if weak_skill_tags:
        msg += f" · Reinforcing: {', '.join(list(weak_skill_tags)[:2])}"

    return DailyMissionResponse(
        tasks=selected,
        total_xp_available=total_xp,
        message=msg
    )


# ── GET /progress/skill-graph ──────────────────────────────────────────────────

@router.get("/skill-graph", response_model=List[SkillProgressItem])
async def get_skill_graph(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Per-skill completion percentage across all roadmap tasks."""
    nodes_result = await db.execute(
        select(RoadmapNode).where(RoadmapNode.user_id == current_user.id)
    )
    nodes = nodes_result.scalars().all()
    if not nodes:
        return []

    node_ids = [n.id for n in nodes]
    tasks_result = await db.execute(
        select(Task).where(Task.node_id.in_(node_ids), Task.skill_tags != None)
    )
    all_tasks = tasks_result.scalars().all()

    skill_stats: dict[str, dict] = {}
    for task in all_tasks:
        try:
            tags = json.loads(task.skill_tags or "[]")
        except Exception:
            tags = []
        for tag in tags:
            if tag not in skill_stats:
                skill_stats[tag] = {"total": 0, "completed": 0}
            skill_stats[tag]["total"] += 1
            if task.is_completed:
                skill_stats[tag]["completed"] += 1

    result = []
    for skill, stats in sorted(skill_stats.items()):
        pct = round((stats["completed"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0
        result.append(SkillProgressItem(
            skill=skill,
            total_tasks=stats["total"],
            completed_tasks=stats["completed"],
            percentage=pct
        ))

    return sorted(result, key=lambda x: x.percentage, reverse=True)
