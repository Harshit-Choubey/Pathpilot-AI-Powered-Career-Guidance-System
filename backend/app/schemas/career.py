from typing import List, Optional
from pydantic import BaseModel

class CareerBase(BaseModel):
    slug: str
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    salary_range: Optional[str] = None
    job_growth_percentage: Optional[str] = None
    time_to_start: Optional[str] = None
    experience_level: Optional[str] = None
    advantages: List[str] = []
    challenges: List[str] = []
    required_skills: List[str] = []
    tags: List[str] = []

class CareerResponse(CareerBase):
    id: str

    class Config:
        from_attributes = True

class CareerCompareRequest(BaseModel):
    slugs: List[str]
    language: Optional[str] = "en"

class CareerCompareResponse(BaseModel):
    success: bool
    data: List[CareerResponse]
