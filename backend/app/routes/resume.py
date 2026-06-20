from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from datetime import datetime, timezone
from app.database import get_database
from app.utils.security import get_current_user_id
from app.utils.helpers import serialize_doc
from app.services.parser_service import ParserService
from app.services.llm_service import LLMService
from bson import ObjectId
import logging

logger = logging.getLogger("placement_prep")
router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    # Read file contents
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )
        
    # Parse file contents to raw text
    try:
        raw_text = ParserService.parse_file(file.filename, contents)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error parsing resume document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse document: {str(e)}"
        )
        
    # Parse raw text using LLM into structured metadata
    try:
        parsed_data = LLMService.parse_resume(raw_text)
    except Exception as e:
        logger.error(f"LLM parsing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze resume content using AI"
        )
        
    resume_doc = {
        "user_id": ObjectId(user_id),
        "filename": file.filename,
        "raw_text": raw_text,
        "parsed_data": parsed_data,
        "uploaded_at": datetime.now(timezone.utc)
    }
    
    # Store in MongoDB (overwrite existing or store new one)
    # We will do an insert to keep history, but we can query the latest
    result = await db.resumes.insert_one(resume_doc)
    
    inserted_resume = await db.resumes.find_one({"_id": result.inserted_id})
    return serialize_doc(inserted_resume)

@router.get("/details")
async def get_resume_details(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not initialized")
        
    # Fetch the latest uploaded resume for this user
    resume = await db.resumes.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("uploaded_at", -1)]
    )
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume found. Please upload a resume first."
        )
        
    return serialize_doc(resume)
