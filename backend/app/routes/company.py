from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import List, Optional
from app.database import get_database
from app.utils.security import get_current_user_id
from app.utils.helpers import serialize_doc
from app.models.company import CompanySelectRequest, JDAnalyzeRequest, SkillGapAnalyzeRequest
from app.services.llm_service import LLMService
from bson import ObjectId
import logging

logger = logging.getLogger("placement_prep")
router = APIRouter(tags=["Company & Skill Gap"])

# Target Company presets
COMPANY_PRESETS = {
    "google": {
        "name": "Google",
        "description": "Elite technology organization focusing on search engines, cloud computing, and advanced software systems.",
        "required_skills": ["Python", "C++", "Java", "Go", "Data Structures", "Algorithms", "System Design", "Distributed Systems", "Cloud Computing"]
    },
    "amazon": {
        "name": "Amazon",
        "description": "Global e-commerce and cloud computing giant seeking strong problem solvers and systems builders.",
        "required_skills": ["Java", "Python", "C++", "AWS", "Data Structures", "Algorithms", "System Design", "Object Oriented Design", "Database Systems (NoSQL/SQL)"]
    },
    "microsoft": {
        "name": "Microsoft",
        "description": "Leading developer of enterprise and personal software, cloud platforms, and operating systems.",
        "required_skills": ["C#", "C++", "Azure", "Data Structures", "Algorithms", "System Design", "SQL", "Object Oriented Programming", "Software Engineering"]
    },
    "infosys": {
        "name": "Infosys",
        "description": "Multinational information technology service provider delivering enterprise consulting and development services.",
        "required_skills": ["Java", "Python", "JavaScript", "HTML", "CSS", "SQL", "Object Oriented Programming", "Software Engineering", "SDLC"]
    },
    "tcs": {
        "name": "TCS",
        "description": "Global IT services, consulting, and business solutions firm recruiting major talent pools.",
        "required_skills": ["Java", "C++", "C", "Python", "SQL", "HTML", "CSS", "JavaScript", "Software Engineering", "Aptitude & Logical Reasoning"]
    }
}

@router.post("/company/select")
async def select_company(request: CompanySelectRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    company_key = request.company_name.lower().strip()
    
    # Check preset
    if company_key in COMPANY_PRESETS:
        company_data = COMPANY_PRESETS[company_key]
    else:
        # Create a dynamic preset for other companies
        company_data = {
            "name": request.company_name,
            "description": f"Dynamic assessment profile created for target firm {request.company_name}.",
            "required_skills": ["Data Structures", "Algorithms", "Software Engineering", "SQL", "Python", "JavaScript", "System Design"]
        }
        
    # Store dynamic or updated company info in database
    await db.companies.update_one(
        {"name": company_data["name"]},
        {"$set": {
            "description": company_data["description"],
            "required_skills": company_data["required_skills"],
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    saved_company = await db.companies.find_one({"name": company_data["name"]})
    return serialize_doc(saved_company)

@router.post("/jd/analyze")
async def analyze_jd(request: JDAnalyzeRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    if not request.jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is empty"
        )
        
    try:
        extracted_skills = LLMService.extract_skills_from_jd(request.jd_text)
    except Exception as e:
        logger.error(f"Failed to extract skills from JD: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract skills using AI"
        )
        
    jd_doc = {
        "user_id": ObjectId(user_id),
        "company_name": request.company_name,
        "jd_text": request.jd_text,
        "extracted_skills": extracted_skills,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.job_descriptions.insert_one(jd_doc)
    
    inserted_jd = await db.job_descriptions.find_one({"_id": result.inserted_id})
    return serialize_doc(inserted_jd)

@router.post("/skill-gap/analyze")
async def analyze_skill_gap(request: SkillGapAnalyzeRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    # Fetch user's latest resume
    resume = await db.resumes.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("uploaded_at", -1)]
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload your resume before performing skill gap analysis."
        )
        
    resume_skills = resume.get("parsed_data", {}).get("skills", [])
    
    target_skills = []
    # If custom Job Description provided
    if request.jd_id:
        try:
            jd = await db.job_descriptions.find_one({"_id": ObjectId(request.jd_id)})
            if jd:
                target_skills = jd.get("extracted_skills", [])
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Job Description record not found"
                )
        except Exception as e:
            if not isinstance(e, HTTPException):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid job description ID format"
                )
            raise e
    else:
        # Fall back to preset target company
        company_key = request.target_company.lower().strip()
        if company_key in COMPANY_PRESETS:
            target_skills = COMPANY_PRESETS[company_key]["required_skills"]
        else:
            # Check if there is a saved database record
            db_company = await db.companies.find_one({"name": request.target_company})
            if db_company:
                target_skills = db_company.get("required_skills", [])
            else:
                # Default safety
                target_skills = COMPANY_PRESETS["google"]["required_skills"]
                
    try:
        # Evaluate skill gap
        analysis_result = LLMService.analyze_skill_gap(resume_skills, target_skills)
    except Exception as e:
        logger.error(f"Skill gap analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze skill gaps using AI"
        )
        
    analysis_doc = {
        "user_id": ObjectId(user_id),
        "resume_id": resume["_id"],
        "target_company": request.target_company,
        "matching_skills": analysis_result.get("matching_skills", []),
        "missing_skills": analysis_result.get("missing_skills", []),
        "match_percentage": float(analysis_result.get("match_percentage", 0.0)),
        "ats_score": float(analysis_result.get("ats_score", 0.0)),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.skill_analysis.insert_one(analysis_doc)
    
    inserted_analysis = await db.skill_analysis.find_one({"_id": result.inserted_id})
    return serialize_doc(inserted_analysis)
