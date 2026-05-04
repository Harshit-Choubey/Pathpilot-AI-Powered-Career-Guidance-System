import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.chat import UserSemanticMemory

class UserDecisionState:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.rejected_careers = []
        self.preferences = {
            "interest_type": [],
            "effort_tolerance": "any",
            "time_commitment": "any"
        }
        self.narrowed_options = []

    @classmethod
    async def load_from_db(cls, db: AsyncSession, user_id: str):
        state = cls(user_id)
        
        # Load from semantic memory
        query = select(UserSemanticMemory).where(UserSemanticMemory.user_id == user_id)
        result = await db.execute(query)
        memories = result.scalars().all()
        
        for mem in memories:
            fact = mem.fact.lower()
            # Basic parsing rules to build state
            if "reject" in fact or "don't like" in fact or "not interested in" in fact:
                for career in ["Teacher", "Doctor", "UI/UX Designer", "Data Scientist", "Software Engineer"]:
                    if career.lower() in fact:
                        if career not in state.rejected_careers:
                            state.rejected_careers.append(career)
                            
            if "prefer remote" in fact:
                state.preferences["work_style"] = "remote"
            
            # Additional inference can be done here.
            
        return state
