"""
Web Content API endpoints for serving converted PDF content
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.user import User
import json
import os
from pathlib import Path

router = APIRouter()

@router.get("/courses/{course_id}/web-content")
async def get_course_web_content(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get converted web content for a course."""
    
    # Check if user is enrolled in the course
    from ..models.learning import Enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == "active"
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course"
        )
    
    # Load converted content
    content_file = Path("converted_content/workbook_content.json")
    if not content_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Web content not available for this course"
        )
    
    try:
        with open(content_file, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        return JSONResponse(content=content)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading web content: {str(e)}"
        )

@router.get("/courses/{course_id}/web-content/sections/{section_id}")
async def get_web_content_section(
    course_id: int,
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific section of web content."""
    
    # Check enrollment
    from ..models.learning import Enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You are not enrolled in this course"
        )
    
    # Load content and find section
    content_file = Path("converted_content/workbook_content.json")
    if not content_file.exists():
        raise HTTPException(
            status_code=404,
            detail="Web content not available for this course"
        )
    
    try:
        with open(content_file, 'r', encoding='utf-8') as f:
            content = json.load(f)
        
        sections = content.get('sections', [])
        if section_id < 1 or section_id > len(sections):
            raise HTTPException(
                status_code=404,
                detail="Section not found"
            )
        
        section = sections[section_id - 1]  # Convert to 0-based index
        return JSONResponse(content=section)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error loading section: {str(e)}"
        )



