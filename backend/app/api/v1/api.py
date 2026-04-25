from fastapi import APIRouter
from app.api.v1.endpoints import auth, event, assessment, roadmap, chat, career

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(event.router, prefix="/events", tags=["events"])
api_router.include_router(assessment.router, prefix="/assessment", tags=["assessment"])
api_router.include_router(roadmap.router, prefix="/roadmaps", tags=["roadmap"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(career.router, prefix="/career", tags=["career"])
