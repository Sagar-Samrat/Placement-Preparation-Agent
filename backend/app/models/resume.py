from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EducationItem(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None
    gpa: Optional[str] = None

class ProjectItem(BaseModel):
    title: str
    description: str
    technologies: List[str] = []

class ExperienceItem(BaseModel):
    role: str
    company: str
    duration: Optional[str] = None
    description: Optional[str] = None

class ResumeParsedData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    education: List[EducationItem] = []
    skills: List[str] = []
    projects: List[ProjectItem] = []
    experience: List[ExperienceItem] = []
    certifications: List[str] = []

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    parsed_data: ResumeParsedData
    uploaded_at: datetime
