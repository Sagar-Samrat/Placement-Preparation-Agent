from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.database import get_database
from app.utils.security import get_current_user_id
from app.utils.helpers import serialize_doc
from app.models.interview import InterviewStartRequest, AnswerSubmitRequest
from app.services.llm_service import LLMService
from bson import ObjectId
import logging

logger = logging.getLogger("placement_prep")
router = APIRouter(prefix="/interview", tags=["Mock Interview"])

@router.post("/start")
async def start_interview(request: InterviewStartRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    # Get latest resume
    resume = await db.resumes.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("uploaded_at", -1)]
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a resume first to run mock interviews."
        )
        
    # Find latest skill gap analysis for missing skills
    skill_analysis = await db.skill_analysis.find_one(
        {"user_id": ObjectId(user_id), "target_company": request.company_name},
        sort=[("created_at", -1)]
    )
    
    missing_skills = skill_analysis.get("missing_skills", []) if skill_analysis else []
    
    try:
        # Generate 5 interview questions
        questions_raw = LLMService.generate_questions(
            resume_data=resume,
            company_name=request.company_name,
            round_type=request.round_type,
            missing_skills=missing_skills
        )
    except Exception as e:
        logger.error(f"Failed to generate questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate interview questions using AI"
        )
        
    if not questions_raw:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI generated empty question set"
        )
        
    # Standardize questions structure
    questions = []
    for idx, q in enumerate(questions_raw):
        questions.append({
            "question_id": q.get("question_id", f"q{idx+1}"),
            "question_text": q.get("question_text", q.get("text", "")),
            "category": q.get("category", "General"),
            "user_answer": None,
            "evaluation": None
        })
        
    interview_doc = {
        "user_id": ObjectId(user_id),
        "resume_id": resume["_id"],
        "company_name": request.company_name,
        "round_type": request.round_type,
        "questions": questions,
        "current_question_index": 0,
        "status": "ongoing",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.interviews.insert_one(interview_doc)
    
    # Return first question along with metadata
    return {
        "interview_id": str(result.inserted_id),
        "company_name": request.company_name,
        "round_type": request.round_type,
        "total_questions": len(questions),
        "current_question_index": 0,
        "current_question": questions[0],
        "status": "ongoing"
    }

@router.post("/answer")
async def submit_answer(request: AnswerSubmitRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    try:
        interview = await db.interviews.find_one({"_id": ObjectId(request.interview_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
        
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if interview.get("status") == "completed":
        raise HTTPException(status_code=400, detail="This interview session is already completed.")
        
    questions = interview.get("questions", [])
    curr_idx = interview.get("current_question_index", 0)
    
    if curr_idx >= len(questions):
        raise HTTPException(status_code=400, detail="No more questions to answer.")
        
    curr_question = questions[curr_idx]
    
    try:
        # Evaluate current question
        evaluation = LLMService.evaluate_answer(
            question_text=curr_question["question_text"],
            user_answer=request.user_answer
        )
    except Exception as e:
        logger.error(f"Failed to evaluate answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate your answer using AI"
        )
        
    # Update question details
    curr_question["user_answer"] = request.user_answer
    curr_question["evaluation"] = evaluation
    questions[curr_idx] = curr_question
    
    next_idx = curr_idx + 1
    status_str = "ongoing"
    
    if next_idx >= len(questions):
        status_str = "completed"
        
        # Calculate overall score and category aggregates
        total_score = sum(q["evaluation"]["score"] for q in questions if q.get("evaluation"))
        overall_score = round(total_score / len(questions), 1)
        
        accuracy = round(sum(q["evaluation"]["technical_accuracy"] for q in questions if q.get("evaluation")) / len(questions), 1)
        communication = round(sum(q["evaluation"]["communication"] for q in questions if q.get("evaluation")) / len(questions), 1)
        confidence = round(sum(q["evaluation"]["confidence"] for q in questions if q.get("evaluation")) / len(questions), 1)
        completeness = round(sum(q["evaluation"]["completeness"] for q in questions if q.get("evaluation")) / len(questions), 1)
        
        feedback_list = [q["evaluation"]["feedback"] for q in questions if q.get("evaluation")]
        detailed_feedback = " ".join(feedback_list[:3]) # combine first few feedbacks
        
        suggestions = []
        for q in questions:
            if q.get("evaluation") and q["evaluation"].get("suggestions"):
                suggestions.extend(q["evaluation"]["suggestions"])
        suggestions = list(set(suggestions))[:5] # top 5 unique suggestions
        
        result_doc = {
            "interview_id": interview["_id"],
            "user_id": ObjectId(user_id),
            "overall_score": overall_score,
            "category_scores": {
                "accuracy": accuracy,
                "communication": communication,
                "confidence": confidence,
                "completeness": completeness
            },
            "detailed_feedback": detailed_feedback,
            "suggestions": suggestions,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.interview_results.insert_one(result_doc)
        
    # Update interview session record
    await db.interviews.update_one(
        {"_id": interview["_id"]},
        {"$set": {
            "questions": questions,
            "current_question_index": next_idx,
            "status": status_str
        }}
    )
    
    next_question = questions[next_idx] if next_idx < len(questions) else None
    
    return {
        "question_evaluated": curr_question,
        "next_question": next_question,
        "interview_status": status_str,
        "current_question_index": next_idx,
        "total_questions": len(questions)
    }

@router.get("/results/{interview_id}")
async def get_interview_results(interview_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    try:
        result = await db.interview_results.find_one({"interview_id": ObjectId(interview_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid interview ID format")
        
    if not result:
        raise HTTPException(status_code=404, detail="Interview results not found.")
        
    # Also fetch the full interview with questions/answers for deep review
    interview = await db.interviews.find_one({"_id": ObjectId(interview_id)})
    
    serialized_result = serialize_doc(result)
    if interview:
        serialized_result["questions"] = serialize_doc(interview).get("questions", [])
        serialized_result["round_type"] = interview.get("round_type", "")
        serialized_result["company_name"] = interview.get("company_name", "")
        
    return serialized_result
