"""
Course Request API Endpoints
Handles student course access requests and instructor/admin approval
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.course import Course
from ..models.course_request import CourseRequest, CourseRequestForm
from ..models.learning import Enrollment
from ..schemas.course_request import (
    CourseRequestCreate, 
    CourseRequestResponse, 
    CourseRequestReview,
    CourseRequestFormCreate,
    CourseRequestFormResponse
)

router = APIRouter(tags=["Course Requests"])


@router.post("/", response_model=CourseRequestResponse)
async def create_course_request(
    request_data: CourseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a course access request (students only)"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create course requests"
        )
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == request_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if student is already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == request_data.course_id,
        Enrollment.status == "active"
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already enrolled in this course"
        )
    
    # Check if there's already a pending request
    existing_request = db.query(CourseRequest).filter(
        CourseRequest.student_id == current_user.id,
        CourseRequest.course_id == request_data.course_id,
        CourseRequest.status == "pending"
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending request for this course"
        )
    
    # Create the request
    course_request = CourseRequest(
        student_id=current_user.id,
        course_id=request_data.course_id,
        request_reason=request_data.request_reason,
        additional_info=request_data.additional_info,
        status="pending"
    )
    
    db.add(course_request)
    db.commit()
    db.refresh(course_request)
    
    return course_request


@router.get("/my-requests", response_model=List[CourseRequestResponse])
async def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's course requests"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their own requests"
        )
    
    requests = db.query(CourseRequest).filter(
        CourseRequest.student_id == current_user.id
    ).order_by(CourseRequest.requested_at.desc()).all()
    
    return requests


@router.get("/pending", response_model=List[CourseRequestResponse])
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all pending course requests (instructor/admin only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors and admins can view pending requests"
        )
    
    # If instructor, only show requests for their courses
    if current_user.role == "instructor":
        requests = db.query(CourseRequest).join(Course).filter(
            CourseRequest.status == "pending",
            Course.instructor_id == current_user.id
        ).order_by(CourseRequest.requested_at.desc()).all()
    else:  # admin
        requests = db.query(CourseRequest).filter(
            CourseRequest.status == "pending"
        ).order_by(CourseRequest.requested_at.desc()).all()
    
    return requests


@router.post("/{request_id}/review", response_model=CourseRequestResponse)
async def review_course_request(
    request_id: int,
    review_data: CourseRequestReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Review and approve/reject a course request (instructor/admin only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors and admins can review requests"
        )
    
    # Get the request
    course_request = db.query(CourseRequest).filter(
        CourseRequest.id == request_id
    ).first()
    
    if not course_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course request not found"
        )
    
    # Check if already reviewed
    if course_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This request has already been reviewed"
        )
    
    # If instructor, check if they own the course
    if current_user.role == "instructor":
        course = db.query(Course).filter(Course.id == course_request.course_id).first()
        if not course or course.instructor_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review requests for your own courses"
            )
    
    # Update the request
    course_request.status = review_data.status
    course_request.reviewed_by = current_user.id
    course_request.review_notes = review_data.review_notes
    course_request.reviewed_at = datetime.utcnow()
    
    # If approved, create enrollment
    if review_data.status == "approved":
        enrollment = Enrollment(
            user_id=course_request.student_id,
            course_id=course_request.course_id,
            status="active"
        )
        db.add(enrollment)
    
    db.commit()
    db.refresh(course_request)
    
    return course_request


@router.get("/course/{course_id}/form", response_model=CourseRequestFormResponse)
async def get_course_request_form(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the request form for a specific course"""
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get the form for this course
    form = db.query(CourseRequestForm).filter(
        CourseRequestForm.course_id == course_id,
        CourseRequestForm.is_active == True
    ).first()
    
    if not form:
        # Return a default form if none exists
        return CourseRequestFormResponse(
            id=0,
            course_id=course_id,
            form_title=f"Request Access to {course.title}",
            form_description="Please provide the following information to request access to this course.",
            required_fields=["request_reason"],
            optional_fields=["additional_info"],
            is_active=True
        )
    
    return form


@router.post("/course/{course_id}/form", response_model=CourseRequestFormResponse)
async def create_course_request_form(
    course_id: int,
    form_data: CourseRequestFormCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a course request form (instructor/admin only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors and admins can create request forms"
        )
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # If instructor, check if they own the course
    if current_user.role == "instructor" and course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create forms for your own courses"
        )
    
    # Deactivate existing form
    existing_form = db.query(CourseRequestForm).filter(
        CourseRequestForm.course_id == course_id,
        CourseRequestForm.is_active == True
    ).first()
    
    if existing_form:
        existing_form.is_active = False
    
    # Create new form
    form = CourseRequestForm(
        course_id=course_id,
        form_title=form_data.form_title,
        form_description=form_data.form_description,
        required_fields=form_data.required_fields,
        optional_fields=form_data.optional_fields,
        created_by=current_user.id
    )
    
    db.add(form)
    db.commit()
    db.refresh(form)
    
    return form



