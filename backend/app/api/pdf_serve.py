"""
PDF serving endpoints for viewing uploaded documents
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
import os
from jose import JWTError, jwt

from ..core.database import get_db
from ..core.config import settings
from ..api.auth import get_current_user
from ..models.course import Course, CourseFileContent
from ..models.user import User

router = APIRouter()


def get_user_from_token(token: str, db: Session) -> User:
    """Get user from JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@router.get("/courses/{course_id}/content/{content_id}/pdf-viewer")
async def view_pdf(
    course_id: int,
    content_id: int,
    token: str = Query(..., description="JWT token for authentication"),
    db: Session = Depends(get_db)
):
    """Serve PDF file for viewing"""
    
    # Get user from token
    current_user = get_user_from_token(token, db)
    
    # Verify course access
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user has access to the course
    if current_user.role == "instructor":
        # Instructors can only access their own courses
        if course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this course"
            )
    elif current_user.role == "student":
        # Students need to be enrolled in the course
        from ..models.learning import Enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )
    
    # Get the content file
    content_file = db.query(CourseFileContent).filter(
        CourseFileContent.id == content_id,
        CourseFileContent.course_id == course_id,
        CourseFileContent.is_active == True
    ).first()
    
    if not content_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Check if file exists
    file_path = Path(content_file.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found on server"
        )
    
    # Verify it's a PDF file
    if not file_path.suffix.lower() == '.pdf':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not a PDF"
        )
    
    # Return the PDF file
    return FileResponse(
        path=str(file_path),
        media_type='application/pdf',
        filename=content_file.title + '.pdf',
        headers={
            'Content-Disposition': f'inline; filename="{content_file.title}.pdf"'
        }
    )


@router.get("/courses/{course_id}/content/{content_id}/download")
async def download_pdf(
    course_id: int,
    content_id: int,
    token: str = Query(..., description="JWT token for authentication"),
    db: Session = Depends(get_db)
):
    """Download PDF file"""
    
    # Get user from token
    current_user = get_user_from_token(token, db)
    
    # Verify course access (same logic as view_pdf)
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user has access to the course
    if current_user.role == "instructor":
        if course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this course"
            )
    elif current_user.role == "student":
        from ..models.learning import Enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course"
            )
    
    # Get the content file
    content_file = db.query(CourseFileContent).filter(
        CourseFileContent.id == content_id,
        CourseFileContent.course_id == course_id,
        CourseFileContent.is_active == True
    ).first()
    
    if not content_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Check if file exists
    file_path = Path(content_file.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file not found on server"
        )
    
    # Return the PDF file for download
    return FileResponse(
        path=str(file_path),
        media_type='application/pdf',
        filename=content_file.title + '.pdf',
        headers={
            'Content-Disposition': f'attachment; filename="{content_file.title}.pdf"'
        }
    )
