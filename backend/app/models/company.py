from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CompanySelectRequest(BaseModel):
    company_name: str

class CompanyResponse(BaseModel):
    id: str
    name: str
    description: str
    required_skills: List[str]
    created_at: datetime

class JDAnalyzeRequest(BaseModel):
    company_name: str
    jd_text: str

class JDResponse(BaseModel):
    id: str
    user_id: str
    company_name: str
    jd_text: str
    extracted_skills: List[str]
    created_at: datetime

class SkillGapAnalyzeRequest(BaseModel):
    target_company: str
    # If a custom JD is analyzed, we will check that, otherwise default to target company preset
    jd_id: Optional[str] = None 

class SkillGapResponse(BaseModel):
    id: str
    user_id: str
    resume_id: str
    target_company: str
    matching_skills: List[str]
    missing_skills: List[str]
    match_percentage: float
    ats_score: float
    created_at: datetime
