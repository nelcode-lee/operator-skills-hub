"""
Course requests API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User, UserProfile
from ..models.course import Course
from ..models.course_request import CourseRequest, RequestStatus
from ..models.learning import Enrollment
from ..schemas.course_request import CourseRequestCreate, CourseRequestResponse, CourseRequestUpdate

router = APIRouter(tags=["Course Requests"])


@router.get("/", response_model=List[CourseRequestResponse])
async def get_course_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course requests (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get requests for courses owned by this instructor
    requests = db.query(CourseRequest).join(Course).filter(
        Course.instructor_id == current_user.id
    ).order_by(CourseRequest.created_at.desc()).all()
    
    return requests


@router.post("/", response_model=CourseRequestResponse)
async def create_course_request(
    request: CourseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a course access request (student only)"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == request.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == request.course_id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Check if request already exists
    existing_request = db.query(CourseRequest).filter(
        CourseRequest.student_id == current_user.id,
        CourseRequest.course_id == request.course_id,
        CourseRequest.status == RequestStatus.PENDING
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="Request already pending")
    
    # Create request
    course_request = CourseRequest(
        student_id=current_user.id,
        course_id=request.course_id,
        message=request.message,
        status=RequestStatus.PENDING
    )
    
    db.add(course_request)
    db.commit()
    db.refresh(course_request)
    
    return course_request


@router.put("/{request_id}", response_model=CourseRequestResponse)
async def update_course_request(
    request_id: int,
    request_update: CourseRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update course request status (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get the request
    course_request = db.query(CourseRequest).join(Course).filter(
        CourseRequest.id == request_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update status
    course_request.status = request_update.status
    course_request.instructor_response = request_update.instructor_response
    course_request.updated_at = datetime.utcnow()
    
    # If approved, create enrollment
    if request_update.status == RequestStatus.APPROVED:
        enrollment = Enrollment(
            user_id=course_request.student_id,
            course_id=course_request.course_id,
            status="active",
            enrolled_at=datetime.utcnow(),
            progress=0.0
        )
        db.add(enrollment)
    
    db.commit()
    db.refresh(course_request)
    
    return course_request


@router.get("/my-requests", response_model=List[CourseRequestResponse])
async def get_my_course_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's course requests"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    requests = db.query(CourseRequest).filter(
        CourseRequest.student_id == current_user.id
    ).order_by(CourseRequest.created_at.desc()).all()
    
    return requests