from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class RoadmapTask(BaseModel):
    id: str
    topic: str
    description: str
    category: str  # e.g., DSA, DBMS, OS, OOP, System Design, Development Skills, Aptitude Topics
    resources: List[str] = []

class RoadmapPlans(BaseModel):
    thirty_day: List[RoadmapTask] = []
    sixty_day: List[RoadmapTask] = []
    ninety_day: List[RoadmapTask] = []

class RoadmapResponse(BaseModel):
    id: str
    user_id: str
    skill_analysis_id: str
    plans: RoadmapPlans
    completed_tasks: List[str] = []  # List of completed task IDs
    created_at: datetime

class RoadmapToggleRequest(BaseModel):
    task_id: str
    completed: bool
