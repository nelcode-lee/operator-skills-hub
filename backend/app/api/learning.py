"""
Learning and progress tracking API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.learning import Enrollment, LearningSession, Assessment
from ..models.course import Course, CourseModule, CourseContent, CourseFileContent
from ..api.auth import get_current_user

router = APIRouter()


@router.get("/available-courses")
async def get_available_courses(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all available courses for students with enrollment status."""
    from sqlalchemy.orm import joinedload
    from sqlalchemy import and_
    
    # Get all published and active courses
    courses = db.query(Course).filter(
        Course.status == "published",
        Course.is_active == True
    ).all()
    
    # Get user's enrollments
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    
    # Create enrollment lookup
    enrollment_lookup = {e.course_id: e for e in enrollments}
    
    # Build course list with enrollment status
    course_list = []
    for course in courses:
        enrollment = enrollment_lookup.get(course.id)
        
        if enrollment:
            status = "active" if enrollment.status == "active" else "paused"
            progress_percentage = enrollment.progress or 0
            enrolled_at = enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None
            last_accessed = enrollment.updated_at.isoformat() if enrollment.updated_at else None
        else:
            status = "available"
            progress_percentage = 0
            enrolled_at = None
            last_accessed = None
        
        course_list.append({
            "id": course.id,
            "title": course.title,
            "description": course.description or "",
            "category": course.category or "General",
            "duration_hours": course.duration_hours or 0,
            "difficulty_level": course.difficulty_level or "beginner",
            "progress_percentage": progress_percentage,
            "enrolled_at": enrolled_at,
            "last_accessed": last_accessed,
            "status": status
        })
    
    return course_list


@router.get("/categories")
async def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all unique course categories."""
    categories = db.query(Course.category).filter(
        Course.status == "published",
        Course.is_active == True,
        Course.category.isnot(None)
    ).distinct().all()
    
    return [cat[0] for cat in categories if cat[0]]


@router.get("/difficulty-levels")
async def get_difficulty_levels(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all unique difficulty levels."""
    levels = db.query(Course.difficulty_level).filter(
        Course.status == "published",
        Course.is_active == True,
        Course.difficulty_level.isnot(None)
    ).distinct().all()
    
    return [level[0] for level in levels if level[0]]


@router.get("/enrollments")
async def get_user_enrollments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get current user's course enrollments."""
    from sqlalchemy.orm import joinedload
    enrollments = db.query(Enrollment).options(joinedload(Enrollment.course)).filter(Enrollment.user_id == current_user.id).all()
    return enrollments


@router.post("/enroll/{course_id}")
async def request_course_enrollment(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Request enrollment in a course (creates course request for students)."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can request course enrollment"
        )
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id,
        Enrollment.status == "active"
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already enrolled in this course"
        )
    
    # Check if there's already a pending request
    from ..models.course_request import CourseRequest, RequestStatus
    existing_request = db.query(CourseRequest).filter(
        CourseRequest.student_id == current_user.id,
        CourseRequest.course_id == course_id,
        CourseRequest.status == RequestStatus.pending
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending request for this course"
        )
    
    # Create course request
    course_request = CourseRequest(
        student_id=current_user.id,
        course_id=course_id,
        message=f"Requesting access to {course.title}",
        status=RequestStatus.pending
    )
    
    db.add(course_request)
    db.commit()
    db.refresh(course_request)
    
    return {
        "message": "Course access request submitted successfully",
        "request_id": course_request.id,
        "course_title": course.title
    }


@router.post("/enrollments/{course_id}")
async def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Enroll in a course - STUDENTS CANNOT SELF-ENROLL. Only admin/instructor can grant access."""
    # Students cannot self-enroll - they must be authorized by admin/instructor
    if current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot self-enroll. Please contact your instructor or admin to be granted access to this course."
        )
    
    # Only admin/instructor can enroll students
    if current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or instructor can enroll students in courses"
        )
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # For instructors, check if they own the course
    if current_user.role == "instructor" and course.instructor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only enroll students in your own courses"
        )
    
    # This endpoint now requires a student_id parameter for admin/instructor to enroll students
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Use the course management endpoints to enroll students in courses"
    )


@router.get("/courses/{course_id}/modules")
async def get_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get course modules for enrolled students."""
    # Check if user is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course"
        )
    
    # Get course modules
    modules = db.query(CourseModule).filter(
        CourseModule.course_id == course_id
    ).all()
    
    return modules


@router.get("/courses/{course_id}/content")
async def get_course_content(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get course content for enrolled students."""
    # Check if user is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course"
        )
    
    # Get course content files
    content_files = db.query(CourseFileContent).filter(
        CourseFileContent.course_id == course_id,
        CourseFileContent.is_active == True
    ).all()
    
    return content_files


@router.get("/courses/{course_id}/content/{content_id}/view")
async def view_course_content(
    course_id: int,
    content_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """View course content for enrolled students."""
    # Check if user is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course"
        )
    
    # Get content file
    content = db.query(CourseFileContent).filter(
        CourseFileContent.id == content_id,
        CourseFileContent.course_id == course_id,
        CourseFileContent.is_active == True
    ).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    return {
        "content_id": content.id,
        "title": content.title,
        "description": content.description,
        "content_type": content.content_type,
        "file_path": content.file_path,
        "page_count": content.page_count,
        "viewer_url": f"/api/courses/{course_id}/content/{content_id}/pdf-viewer"
    }

