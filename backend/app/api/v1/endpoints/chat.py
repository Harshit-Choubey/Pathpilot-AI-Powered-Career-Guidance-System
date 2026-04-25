import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_current_active_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.assessment import AssessmentResult
from google import genai

logger = logging.getLogger("pathpilot")
router = APIRouter()

@router.post("/") # Removing rate limit for Dev environment temporarily based on user needs
async def chat_interaction(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Standard Prompt IO. Proxies securely to the LLM.
    """
    prompt = payload.get("message", "")
    language_code = payload.get("context", "en")  # Expected: 'en', 'hi', or 'mr'
    
    if not prompt:
        return {"success": False, "data": {"reply": "Please provide a message."}}
    
    # Read key from centralized settings
    api_key = settings.GEMINI_API_KEY
    
    if not api_key:
        return {
            "success": True, 
            "data": {
                "reply": f"Hello {current_user.full_name}! The AI model is currently offline. Please ask the system administrator to configure the `GEMINI_API_KEY` in the environment variables to activate full LLM guidance."
            }
        }
        
    genai_key = settings.GEMINI_API_KEY
    if not genai_key:
        return {
            "success": True, 
            "data": {
                "reply": f"Hello {current_user.full_name}! The AI model is currently offline. Please configure `GEMINI_API_KEY` in the backend environment variables to activate full LLM guidance."
            }
        }
    
    genai.configure = lambda **kwargs: None  # no-op, new SDK uses Client pattern
    api_key = genai_key
    # Build dynamic prompt context
    stmt = select(AssessmentResult).where(AssessmentResult.user_id == current_user.id).order_by(AssessmentResult.created_at.desc())
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    context_str = f"User Name: {current_user.full_name}. "
    if assessment and assessment.ml_results and "predictions" in assessment.ml_results:
        if len(assessment.ml_results["predictions"]) > 0:
            top_career = assessment.ml_results["predictions"][0]["career"]
            context_str += f"Their AI-predicted ideal career is: {top_career}. "
    else:
        context_str += "They have not completed their career assessment yet. "
        
    # Map code to explicit textual language requirement for LLM instruction clarity
    lang_map = {"en": "English", "hi": "Hindi", "mr": "Marathi"}
    target_language = lang_map.get(language_code, "English")
        
    system_instruction = f"You are PathPilot, an expert AI career guidance counselor. {context_str} Provide concise, encouraging, and actionable advice to help them achieve their career goals based on their current status. CRITICAL: You must answer enthusiastically and fluently in {target_language}."
    
    try:
        client = genai.Client(api_key=api_key)
        full_prompt = f"{system_instruction}\n\nUser: {prompt}"
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )
        reply = response.text
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        reply = f"I apologize, I am experiencing cognitive difficulties accessing the AI network right now."
    
    return {
        "success": True, 
        "data": {"reply": reply}
    }
