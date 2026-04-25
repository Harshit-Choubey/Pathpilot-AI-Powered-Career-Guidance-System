from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_user
from app.core import security
from app.core.config import settings
from app.repositories.user import user_repo
from app.schemas.user import Token, UserResponse, UserCreate
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
):
    """
    Register a new user.
    """
    user = await user_repo.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = await user_repo.create(db, obj_in=user_in)
    return user


@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await user_repo.get_by_email(db, email=form_data.username)
    if user is None or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = security.create_access_token(
        user.id
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user.
    """
    return current_user
