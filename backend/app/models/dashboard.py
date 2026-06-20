from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class InterviewHistoryItem(BaseModel):
    interview_id: str
    company_name: str
    round_type: str
    overall_score: float
    created_at: datetime

class DashboardResponse(BaseModel):
    resume_match_percentage: float
    ats_score: float
    missing_skills_count: int
    interview_performance: List[InterviewHistoryItem]
    placement_readiness_score: float
    skills_learned_count: int
    total_skills_count: int
    missing_skills: List[str]
    matching_skills: List[str]
    learning_progress_by_category: Dict[str, float]
