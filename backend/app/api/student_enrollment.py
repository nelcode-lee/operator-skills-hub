"""
Student enrollment API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from datetime import datetime

from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.course import Course
from ..models.learning import Enrollment
from ..models.user import User
from ..schemas.learning import StudentCourseResponse

router = APIRouter()


@router.get("/available-courses", response_model=List[StudentCourseResponse])
async def get_available_courses(
    search: str = None,
    category: str = None,
    difficulty: str = None,
    min_duration: int = None,
    max_duration: int = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get courses available for enrollment with advanced filtering."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get all active courses
    query = db.query(Course).filter(Course.is_active == True)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Course.title.ilike(search_term),
                Course.description.ilike(search_term),
                Course.category.ilike(search_term)
            )
        )
    
    # Apply category filter
    if category:
        query = query.filter(Course.category == category)
    
    # Apply difficulty filter
    if difficulty:
        query = query.filter(Course.difficulty_level == difficulty)
    
    # Apply duration filters
    if min_duration is not None:
        query = query.filter(Course.duration_hours >= min_duration)
    
    if max_duration is not None:
        query = query.filter(Course.duration_hours <= max_duration)
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    courses = query.all()
    
    # Check which courses the student is already enrolled in
    enrolled_course_ids = db.query(Enrollment.course_id).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status.in_(["active", "completed"])
        )
    ).all()
    enrolled_course_ids = [course_id[0] for course_id in enrolled_course_ids]
    
    course_list = []
    for course in courses:
        # Determine status based on enrollment
        if course.id in enrolled_course_ids:
            # Get enrollment details
            enrollment = db.query(Enrollment).filter(
                and_(
                    Enrollment.user_id == current_user.id,
                    Enrollment.course_id == course.id
                )
            ).first()
            
            status = "completed" if enrollment.status == "completed" else "active"
            progress = enrollment.progress if enrollment else 0.0
            enrolled_at = enrollment.enrolled_at if enrollment else datetime.utcnow()
            last_accessed = enrollment.updated_at if enrollment else datetime.utcnow()
        else:
            status = "available"
            progress = 0.0
            enrolled_at = datetime.utcnow()
            last_accessed = datetime.utcnow()
            
        course_list.append(StudentCourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            category=course.category,
            duration_hours=course.duration_hours,
            difficulty_level=course.difficulty_level,
            progress_percentage=progress,
            enrolled_at=enrolled_at,
            last_accessed=last_accessed,
            status=status
        ))
    
    return course_list


@router.post("/enroll/{course_id}")
async def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll in a course."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Check if course exists and is active
    course = db.query(Course).filter(
        and_(
            Course.id == course_id,
            Course.is_active == True
        )
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not available for enrollment."
        )
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        )
    ).first()
    
    if existing_enrollment:
        if existing_enrollment.status == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already enrolled in this course."
            )
        elif existing_enrollment.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already completed this course."
            )
        else:
            # Reactivate enrollment
            existing_enrollment.status = "active"
            existing_enrollment.updated_at = datetime.utcnow()
            db.commit()
            return {"message": "Successfully re-enrolled in course", "course_id": course_id}
    
    # Create new enrollment
    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        status="active",
        enrolled_at=datetime.utcnow()
    )
    
    db.add(enrollment)
    db.commit()
    
    return {"message": "Successfully enrolled in course", "course_id": course_id}


@router.post("/unenroll/{course_id}")
async def unenroll_from_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unenroll from a course."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Find enrollment
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not enrolled in this course."
        )
    
    # Update enrollment status
    enrollment.status = "paused"
    enrollment.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Successfully unenrolled from course", "course_id": course_id}


@router.get("/categories")
async def get_course_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available course categories."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    categories = db.query(Course.category).filter(
        Course.is_active == True
    ).distinct().all()
    
    return [category[0] for category in categories if category[0]]


@router.get("/difficulty-levels")
async def get_difficulty_levels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available difficulty levels."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    levels = db.query(Course.difficulty_level).filter(
        Course.is_active == True
    ).distinct().all()
    
    return [level[0] for level in levels if level[0]]


@router.get("/course-stats")
async def get_course_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course statistics for the student."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get enrollment statistics
    total_enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).count()
    
    active_enrollments = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "active"
        )
    ).count()
    
    completed_enrollments = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "completed"
        )
    ).count()
    
    # Get total available courses
    total_available = db.query(Course).filter(Course.is_active == True).count()
    
    # Get category distribution
    category_stats = db.query(
        Course.category,
        db.func.count(Course.id).label('count')
    ).filter(Course.is_active == True).group_by(Course.category).all()
    
    return {
        "total_available_courses": total_available,
        "total_enrollments": total_enrollments,
        "active_enrollments": active_enrollments,
        "completed_enrollments": completed_enrollments,
        "category_distribution": [
            {"category": cat, "count": count} 
            for cat, count in category_stats
        ]
    }


@router.get("/recommendations")
async def get_course_recommendations(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course recommendations based on student's enrollment history."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get student's enrolled course categories
    enrolled_categories = db.query(Course.category).join(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status.in_(["active", "completed"])
        )
    ).distinct().all()
    
    enrolled_categories = [cat[0] for cat in enrolled_categories if cat[0]]
    
    # Get courses in similar categories that student hasn't enrolled in
    enrolled_course_ids = db.query(Enrollment.course_id).filter(
        Enrollment.user_id == current_user.id
    ).all()
    enrolled_course_ids = [course_id[0] for course_id in enrolled_course_ids]
    
    query = db.query(Course).filter(
        and_(
            Course.is_active == True,
            Course.id.notin_(enrolled_course_ids)
        )
    )
    
    if enrolled_categories:
        query = query.filter(Course.category.in_(enrolled_categories))
    
    # Order by popularity (assuming more enrollments = more popular)
    recommended_courses = query.order_by(Course.created_at.desc()).limit(limit).all()
    
    course_list = []
    for course in recommended_courses:
        course_list.append(StudentCourseResponse(
            id=course.id,
            title=course.title,
            description=course.description,
            category=course.category,
            duration_hours=course.duration_hours,
            difficulty_level=course.difficulty_level,
            progress_percentage=0.0,
            enrolled_at=datetime.utcnow(),
            last_accessed=datetime.utcnow(),
            status="available"
        ))
    
    return course_list
