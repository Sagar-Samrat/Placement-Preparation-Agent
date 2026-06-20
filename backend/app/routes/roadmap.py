from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.database import get_database
from app.utils.security import get_current_user_id
from app.utils.helpers import serialize_doc
from app.models.roadmap import RoadmapToggleRequest, RoadmapResponse
from app.services.llm_service import LLMService
from bson import ObjectId
import logging

logger = logging.getLogger("placement_prep")
router = APIRouter(prefix="/roadmap", tags=["Learning Roadmap"])

@router.post("/generate")
async def generate_roadmap(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    # Find latest skill gap analysis
    skill_analysis = await db.skill_analysis.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )
    
    if not skill_analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No skill gap analysis report found. Please complete the skill gap analysis step first."
        )
        
    missing_skills = skill_analysis.get("missing_skills", [])
    
    try:
        # Call LLM to generate roadmap
        roadmap_plans = LLMService.generate_roadmap(missing_skills)
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate roadmap using AI"
        )
        
    roadmap_doc = {
        "user_id": ObjectId(user_id),
        "skill_analysis_id": skill_analysis["_id"],
        "plans": roadmap_plans,
        "completed_tasks": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    # Save/Replace current active roadmap
    await db.roadmaps.delete_many({"user_id": ObjectId(user_id)}) # only keep the active roadmap
    result = await db.roadmaps.insert_one(roadmap_doc)
    
    inserted_roadmap = await db.roadmaps.find_one({"_id": result.inserted_id})
    return serialize_doc(inserted_roadmap)

@router.get("/active")
async def get_active_roadmap(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    roadmap = await db.roadmaps.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )
    
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active roadmap found. Please generate one first."
        )
        
    return serialize_doc(roadmap)

@router.post("/toggle-task")
async def toggle_task(request: RoadmapToggleRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    roadmap = await db.roadmaps.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )
    
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active roadmap found."
        )
        
    completed_tasks = list(roadmap.get("completed_tasks", []))
    
    if request.completed:
        if request.task_id not in completed_tasks:
            completed_tasks.append(request.task_id)
    else:
        if request.task_id in completed_tasks:
            completed_tasks.remove(request.task_id)
            
    await db.roadmaps.update_one(
        {"_id": roadmap["_id"]},
        {"$set": {"completed_tasks": completed_tasks}}
    )
    
    updated_roadmap = await db.roadmaps.find_one({"_id": roadmap["_id"]})
    return serialize_doc(updated_roadmap)
