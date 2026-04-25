from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from app.models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Strong password with min 8 chars")

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: UUID
    role: RoleEnum
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserResponse(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
