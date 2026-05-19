from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.career import CareerProfile
from app.schemas.career import CareerCompareRequest, CareerCompareResponse, CareerResponse

router = APIRouter()

@router.post("/compare", response_model=CareerCompareResponse)
async def compare_careers(
    *,
    request_in: CareerCompareRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full metadata for the requested career slugs.
    """
    query = select(CareerProfile).where(CareerProfile.slug.in_(request_in.slugs))
    result = await db.execute(query)
    careers = result.scalars().all()
    
    # Sort them in the exact order they were requested
    slug_map = {c.slug: c for c in careers}
    ordered_careers = []
    for slug in request_in.slugs:
        if slug in slug_map:
            ordered_careers.append(slug_map[slug])
            
    response_data = []
    
    language = request_in.language or "en"
    if language != "en":
        import os
        import json
        import httpx
        
        LANGUAGE_NAMES = {"hi": "Hindi", "mr": "Marathi"}
        language_name = LANGUAGE_NAMES.get(language, "Hindi")
        
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            raw_data = [
                {
                    "id": str(c.id),
                    "slug": c.slug,
                    "name": c.name,
                    "category": c.category,
                    "description": c.description,
                    "salary_range": c.salary_range,
                    "job_growth_percentage": c.job_growth_percentage,
                    "time_to_start": c.time_to_start,
                    "experience_level": c.experience_level,
                    "advantages": c.advantages,
                    "challenges": c.challenges,
                    "required_skills": c.required_skills,
                    "tags": c.tags
                }
                for c in ordered_careers
            ]
            
            translation_prompt = (
                f"You are a professional career counselor. Translate the following career profile metadata list into {language_name}.\n"
                f"Translate only: name, category, description, salary_range, time_to_start, experience_level, advantages[], challenges[], required_skills[], and tags[].\n"
                f"Keep all other fields (keys, ids, slugs, job_growth_percentage, numbers) exactly as-is. Output ONLY raw valid JSON.\n\n"
                f"{json.dumps(raw_data, ensure_ascii=False)}"
            )
            
            try:
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                response = httpx.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": translation_prompt}],
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"].strip()
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                if raw.endswith("```"):
                    raw = raw.rsplit("```", 1)[0]
                raw = raw.strip()
                
                translated_list = json.loads(raw)
                for item in translated_list:
                    response_data.append(CareerResponse(
                        id=item.get("id"),
                        slug=item.get("slug"),
                        name=item.get("name"),
                        category=item.get("category"),
                        description=item.get("description"),
                        salary_range=item.get("salary_range"),
                        job_growth_percentage=item.get("job_growth_percentage"),
                        time_to_start=item.get("time_to_start"),
                        experience_level=item.get("experience_level"),
                        advantages=item.get("advantages", []),
                        challenges=item.get("challenges", []),
                        required_skills=item.get("required_skills", []),
                        tags=item.get("tags", [])
                    ))
            except Exception as e:
                import logging
                logging.getLogger("pathpilot").error(f"Career comparison translation error: {e}")
                response_data = []

    # If English or translation failed/fallback
    if not response_data:
        for c in ordered_careers:
            response_data.append(CareerResponse(
                id=str(c.id),
                slug=c.slug,
                name=c.name,
                category=c.category,
                description=c.description,
                salary_range=c.salary_range,
                job_growth_percentage=c.job_growth_percentage,
                time_to_start=c.time_to_start,
                experience_level=c.experience_level,
                advantages=c.advantages,
                challenges=c.challenges,
                required_skills=c.required_skills,
                tags=c.tags
            ))
        
    return CareerCompareResponse(success=True, data=response_data)
