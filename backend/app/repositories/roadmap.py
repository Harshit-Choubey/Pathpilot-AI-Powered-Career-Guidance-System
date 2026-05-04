from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.models.roadmap import RoadmapNode, Task

class RoadmapRepository:
    async def get_roadmap_for_user(self, db: AsyncSession, user_id: UUID) -> List[RoadmapNode]:
        stmt = (
            select(RoadmapNode)
            .where(RoadmapNode.user_id == user_id)
            .options(selectinload(RoadmapNode.tasks))
            .order_by(RoadmapNode.created_at)
        )
        result = await db.execute(stmt)
        nodes = result.scalars().all()
        return nodes


    async def get_task(self, db: AsyncSession, task_id: UUID) -> Optional[Task]:
        result = await db.execute(select(Task).where(Task.id == task_id))
        return result.scalars().first()
        
    async def get_node(self, db: AsyncSession, node_id: UUID) -> Optional[RoadmapNode]:
        result = await db.execute(select(RoadmapNode).where(RoadmapNode.id == node_id))
        return result.scalars().first()

roadmap_repo = RoadmapRepository()
