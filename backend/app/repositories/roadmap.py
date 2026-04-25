from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.models.roadmap import RoadmapNode, Task

class RoadmapRepository:
    async def get_roadmap_for_user(self, db: AsyncSession, user_id: UUID) -> List[RoadmapNode]:
        stmt = select(RoadmapNode).where(RoadmapNode.user_id == user_id).options(selectinload(RoadmapNode.tasks)) # Assuming a relationship 'tasks' exists. Wait, I didn't add relationship 'tasks' in models. I'll need to fetch manually or update models later. Let's write manual fetch logic to be safe.
        
        nodes_result = await db.execute(select(RoadmapNode).where(RoadmapNode.user_id == user_id))
        nodes = nodes_result.scalars().all()
        
        # Load tasks manually since we didn't establish SQLAlchemy back_populates explicitly yet
        if not nodes:
            return []
            
        node_ids = [node.id for node in nodes]
        tasks_result = await db.execute(select(Task).where(Task.node_id.in_(node_ids)))
        tasks = tasks_result.scalars().all()
        
        # Map tasks back
        node_dict = {node.id: node for node in nodes}
        for node in nodes:
            node.tasks = []
        for task in tasks:
            if task.node_id in node_dict:
                node_dict[task.node_id].tasks.append(task)
                
        return nodes

    async def get_task(self, db: AsyncSession, task_id: UUID) -> Optional[Task]:
        result = await db.execute(select(Task).where(Task.id == task_id))
        return result.scalars().first()
        
    async def get_node(self, db: AsyncSession, node_id: UUID) -> Optional[RoadmapNode]:
        result = await db.execute(select(RoadmapNode).where(RoadmapNode.id == node_id))
        return result.scalars().first()

roadmap_repo = RoadmapRepository()
