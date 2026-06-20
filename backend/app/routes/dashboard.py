from fastapi import APIRouter, Depends, HTTPException
from app.database import get_database
from app.utils.security import get_current_user_id
from app.utils.helpers import serialize_doc
from bson import ObjectId
import logging

logger = logging.getLogger("placement_prep")
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
async def get_dashboard_data(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    # 1. Fetch latest skill analysis
    skill_analysis = await db.skill_analysis.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )
    
    resume_match = 0.0
    ats_score = 0.0
    missing_skills = []
    matching_skills = []
    
    if skill_analysis:
        resume_match = float(skill_analysis.get("match_percentage", 0.0))
        ats_score = float(skill_analysis.get("ats_score", 0.0))
        missing_skills = skill_analysis.get("missing_skills", [])
        matching_skills = skill_analysis.get("matching_skills", [])
        
    # 2. Fetch completed interviews history
    interview_cursor = db.interview_results.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    past_interviews = await interview_cursor.to_list(length=100)
    
    interview_performance = []
    total_interview_score = 0.0
    
    for pi in past_interviews:
        # Fetch matching interview details for company & round type
        interview_details = await db.interviews.find_one({"_id": pi["interview_id"]})
        company_name = interview_details.get("company_name", "Target Company") if interview_details else "Target Company"
        round_type = interview_details.get("round_type", "Mock Round") if interview_details else "Mock Round"
        
        score = float(pi.get("overall_score", 0.0))
        total_interview_score += score
        
        interview_performance.append({
            "interview_id": str(pi["interview_id"]),
            "company_name": company_name,
            "round_type": round_type,
            "overall_score": score,
            "created_at": pi["created_at"]
        })
        
    avg_interview_score = (total_interview_score / len(past_interviews)) if past_interviews else 0.0
    
    # 3. Fetch active learning roadmap and calculate progress
    roadmap = await db.roadmaps.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )
    
    completed_tasks_set = set(roadmap.get("completed_tasks", [])) if roadmap else set()
    skills_learned_count = len(completed_tasks_set)
    
    total_tasks = 0
    completed_tasks_count = 0
    
    category_totals = {}
    category_completes = {}
    
    if roadmap and roadmap.get("plans"):
        plans = roadmap["plans"]
        # Merge all periods
        all_tasks = []
        for period in ["thirty_day", "sixty_day", "ninety_day"]:
            tasks_list = plans.get(period, [])
            all_tasks.extend(tasks_list)
            
        total_tasks = len(all_tasks)
        
        for task in all_tasks:
            t_id = task.get("id")
            category = task.get("category", "General Topics")
            
            category_totals[category] = category_totals.get(category, 0) + 1
            if t_id in completed_tasks_set:
                completed_tasks_count += 1
                category_completes[category] = category_completes.get(category, 0) + 1
                
    # Format category learning progress ratios (0-100%)
    learning_progress_by_category = {}
    for cat, total in category_totals.items():
        completes = category_completes.get(cat, 0)
        learning_progress_by_category[cat] = round((completes / total) * 100, 1)
        
    # 4. Placement Readiness Score calculation
    # Formula weights:
    # - ATS Score: 35%
    # - Average Interview Score: 35%
    # - Roadmap Task Completion: 30%
    # If no data exists, calculate based on what is available or set defaults.
    
    roadmap_completion_rate = (completed_tasks_count / total_tasks * 100) if total_tasks > 0 else 0.0
    
    # Weights dynamic check
    score_components = []
    
    # ATS component
    if ats_score > 0:
        score_components.append((ats_score, 0.35))
    else:
        score_components.append((0.0, 0.0))
        
    # Interview component
    if avg_interview_score > 0:
        score_components.append((avg_interview_score, 0.35))
    else:
        score_components.append((0.0, 0.0))
        
    # Roadmap component
    if total_tasks > 0:
        score_components.append((roadmap_completion_rate, 0.30))
    else:
        score_components.append((0.0, 0.0))
        
    total_weight = sum(w for _, w in score_components)
    weighted_score = sum(val * w for val, w in score_components)
    
    placement_readiness_score = 0.0
    if total_weight > 0:
        placement_readiness_score = round(weighted_score / total_weight, 1)
    else:
        # Base default for uploaded resume before analysis
        if skill_analysis:
            placement_readiness_score = round(ats_score, 1)
        else:
            placement_readiness_score = 0.0
            
    return {
        "resume_match_percentage": resume_match,
        "ats_score": ats_score,
        "missing_skills_count": len(missing_skills),
        "interview_performance": interview_performance,
        "placement_readiness_score": placement_readiness_score,
        "skills_learned_count": skills_learned_count,
        "total_skills_count": len(missing_skills) + len(matching_skills),
        "missing_skills": missing_skills,
        "matching_skills": matching_skills,
        "learning_progress_by_category": learning_progress_by_category
    }
