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
