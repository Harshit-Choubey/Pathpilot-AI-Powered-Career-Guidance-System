import logging
import httpx
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_active_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.assessment import AssessmentResult
from app.models.roadmap import UserProgress, RoadmapNode
from app.models.chat import ChatMessage, UserSemanticMemory, MessageRole
from app.engine.user_state import UserDecisionState
from app.engine.decision import DecisionEngine

logger = logging.getLogger("pathpilot")
router = APIRouter()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

async def extract_semantic_memory(db: AsyncSession, user_id: str, user_msg: str, bot_reply: str, message_id: str):
    """
    Background task to extract long-term facts from the conversation.
    For simplicity in this MVP, we will just use a highly targeted prompt to Groq.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key: return

    extraction_prompt = (
        "Analyze this exchange between a user and an AI career mentor.\n"
        "Extract ONLY permanent, factual preferences or struggles the user explicitly states about themselves.\n"
        "Ignore transient questions. If nothing permanent is stated, return exactly 'NONE'.\n"
        "Examples: 'User struggles with SQL joins', 'User prefers visual learning'.\n"
        f"User: {user_msg}\nAI: {bot_reply}"
    )

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "system", "content": extraction_prompt}],
                    "max_tokens": 50,
                    "temperature": 0.1,
                }
            )
            fact = res.json()["choices"][0]["message"]["content"].strip()
            if fact and fact.upper() != "NONE":
                mem = UserSemanticMemory(
                    user_id=user_id,
                    fact=fact,
                    source_message_id=message_id
                )
                db.add(mem)
                await db.commit()
    except Exception as e:
        logger.error(f"Memory extraction failed: {e}")


@router.post("/")
async def mentor_chat(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Context-Aware AI Mentor Chat Endpoint
    """
    message = payload.get("message", "")
    history = payload.get("history", []) # Array of dicts [{"role": "user", "content": "..."}]
    page_context = payload.get("context", {}) # { "page": "Dashboard", "active_task": "..." }
    language = page_context.get("language", "en")

    LANGUAGE_NAMES = { "en": "English", "hi": "Hindi", "mr": "Marathi" }
    language_name = LANGUAGE_NAMES.get(language, "English")

    if not message:
        return {"success": False, "data": {"reply": "Please provide a message."}}

    api_key = settings.GROQ_API_KEY
    if not api_key:
        return {"success": False, "data": {"reply": "AI engine offline (missing API key)."}}

    # 1. Fetch User State (Long-Term Context)
    stmt_prog = select(UserProgress).where(UserProgress.user_id == current_user.id)
    prog_res = await db.execute(stmt_prog)
    progress = prog_res.scalars().first()

    stmt_ass = select(AssessmentResult).where(AssessmentResult.user_id == current_user.id).order_by(AssessmentResult.created_at.desc())
    ass_res = await db.execute(stmt_ass)
    assessment = ass_res.scalars().first()

    stmt_mem = select(UserSemanticMemory).where(UserSemanticMemory.user_id == current_user.id).order_by(UserSemanticMemory.created_at.desc()).limit(10)
    mem_res = await db.execute(stmt_mem)
    semantic_memories = mem_res.scalars().all()

    # 2. Build Dynamic System Prompt
    system_prompt = (
        f"You are the PathPilot AI Mentor. You are a career guide and an action-oriented decision-maker.\n"
        f"CRITICAL LANGUAGE RULE: You MUST respond ONLY in {language_name}. Do NOT use any other language. Even if the user writes in a different language, always reply in {language_name}.\n"
        "CORE RULES:\n"
        "1. Max 5-6 lines per response. Be highly concise.\n"
        "2. Keep a conversational, encouraging mentor tone.\n"
        "3. NO numbered lists and NO 'Step 1, Step 2' unless the user explicitly asks for detailed steps.\n"
        "4. ACTION-FIRST: Always guide the user to their immediate logical next step, but avoid acting like a UI assistant. Do NOT explicitly tell them to 'Click buttons' unless absolutely necessary.\n"
        "5. Do NOT give long lectures or theory dumps. Explain only what is necessary right now.\n"
        "6. If the user's input is vague (e.g., 'help me'), infer their intent from their current screen and ask a targeted question.\n\n"
        "--- USER CONTEXT ---\n"
        f"Name: {current_user.full_name}\n"
    )

    if progress:
        system_prompt += f"Level: {progress.level} | XP: {progress.total_xp} | Streak: {progress.current_streak} days\n"

    # 4. Integrate Hybrid Decision Engine (State & Logic)
    ml_top_choice = None
    if assessment and assessment.ml_results and "predictions" in assessment.ml_results:
        if len(assessment.ml_results["predictions"]) > 0:
            ml_top_choice = assessment.ml_results['predictions'][0]['career']

    # Load state & run engine
    visible_options = page_context.get("visible_options", [])
    user_state = await UserDecisionState.load_from_db(db, str(current_user.id))
    engine = DecisionEngine(user_state=user_state, visible_options=visible_options)
    # If the user explicitly rejects a career, the engine flags it.
    if engine.determine_intent(message) == "rejection":
        for opt in visible_options + [ml_top_choice]:
            if opt and opt.lower() in message.lower() and opt not in user_state.rejected_careers:
                user_state.rejected_careers.append(opt)
                db.add(UserSemanticMemory(user_id=current_user.id, fact=f"User rejected {opt}", source_message_id=uuid.uuid4()))
        
        # Additional broad catch for "teaching" -> "Teacher"
        if "teaching" in message.lower() and "Teacher" not in user_state.rejected_careers:
            user_state.rejected_careers.append("Teacher")

    if ml_top_choice:
        if ml_top_choice in user_state.rejected_careers:
            system_prompt += f"The user has REJECTED the ML baseline career: {ml_top_choice}. Drop it entirely. Do not reference it or infer anything from it.\n"
        else:
            system_prompt += f"Target Career (ML Baseline): {ml_top_choice}\n"

    system_prompt += engine.build_system_prompt_addition(message, ml_top_choice=ml_top_choice)

    # 5. Construct Message Array
    # We limit history to last 10 messages sent by frontend
    messages_payload = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]:
        messages_payload.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    
    messages_payload.append({"role": "user", "content": message})

    # 5. Call LLM
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "messages": messages_payload,
                    "max_tokens": 1024,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            reply = response.json()["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        logger.error(f"Groq API error in mentor chat: HTTPStatusError {e.response.status_code}: {e.response.text}")
        return {"success": False, "data": {"reply": "I'm having a bit of trouble connecting to my knowledge base right now. Please try again in a moment."}}
    except Exception as e:
        logger.error(f"Groq API error in mentor chat: {e}")
        return {"success": False, "data": {"reply": "I'm having a bit of trouble connecting to my knowledge base right now. Please try again in a moment."}}

    # 6. Save messages to DB asynchronously (Optional for full audit log)
    user_msg_id = uuid.uuid4()
    db.add(ChatMessage(id=user_msg_id, user_id=current_user.id, role=MessageRole.user, content=message, context_data=page_context))
    db.add(ChatMessage(id=uuid.uuid4(), user_id=current_user.id, role=MessageRole.assistant, content=reply, context_data=page_context))
    await db.commit()

    # 7. Trigger Semantic Memory Extraction in background
    background_tasks.add_task(extract_semantic_memory, db, current_user.id, message, reply, user_msg_id)

    return {
        "success": True,
        "data": {"reply": reply}
    }
