from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class AssessmentSubmission(BaseModel):
    answers: Dict[str, Any] = Field(..., description="Key-value mapping of psychometric traits")
    demographics: Dict[str, Any] = Field(default={}, description="Optional subset of tracking variables")

class AssessmentResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

class AssessmentResultItem(BaseModel):
    id: str
    created_at: datetime
    status: str
    ml_results: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AssessmentHistoryResponse(BaseModel):
    success: bool
    history: List[AssessmentResultItem]
