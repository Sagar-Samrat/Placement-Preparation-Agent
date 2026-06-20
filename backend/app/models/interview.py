from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class InterviewStartRequest(BaseModel):
    company_name: str
    round_type: str  # "Technical" | "HR" | "Behavioral" | "Project Discussion"

class EvaluationDetail(BaseModel):
    score: int
    technical_accuracy: int
    communication: int
    confidence: int
    completeness: int
    feedback: str
    suggestions: List[str] = []

class InterviewQuestion(BaseModel):
    question_id: str
    question_text: str
    category: str
    user_answer: Optional[str] = None
    evaluation: Optional[EvaluationDetail] = None

class InterviewResponse(BaseModel):
    id: str
    user_id: str
    company_name: str
    round_type: str
    questions: List[InterviewQuestion]
    current_question_index: int
    status: str  # "ongoing" | "completed"
    created_at: datetime

class AnswerSubmitRequest(BaseModel):
    interview_id: str
    user_answer: str

class AnswerSubmitResponse(BaseModel):
    question_evaluated: InterviewQuestion
    next_question: Optional[InterviewQuestion] = None
    interview_status: str  # "ongoing" | "completed"

class InterviewResultResponse(BaseModel):
    id: str
    interview_id: str
    user_id: str
    overall_score: float
    category_scores: dict  # e.g., {"accuracy": 80, "communication": 85, "confidence": 75, "completeness": 90}
    detailed_feedback: str
    suggestions: List[str]
    created_at: datetime
