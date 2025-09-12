"""
Course management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.course import Course, CourseFileContent
from ..models.user import User, UserProfile
from ..models.learning import Enrollment
from ..core.auth import get_current_user
from ..schemas.course import CourseCreate, CourseResponse

router = APIRouter()


@router.get("/")
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all published courses."""
    courses = db.query(Course).filter(
        Course.is_active == True,
        Course.status == "published"
    ).offset(skip).limit(limit).all()
    return courses


@router.get("/instructor-dashboard")
async def get_instructor_courses_with_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get courses with calculated metrics for instructor dashboard"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Get courses for this instructor
        courses = db.query(Course).filter(
            Course.instructor_id == current_user.id,
            Course.is_active == True
        ).all()
        
        course_list = []
        for course in courses:
            # Count enrolled students
            student_count = db.query(Enrollment).filter(
                Enrollment.course_id == course.id,
                Enrollment.status == "active"
            ).count()
            
            # Count content items
            content_count = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course.id,
                CourseFileContent.is_active == True
            ).count()
            
            course_list.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "category": course.category,
                "difficulty_level": course.difficulty_level,
                "duration_hours": course.duration_hours,
                "price": course.price,
                "status": course.status,
                "is_active": course.is_active,
                "instructor_id": course.instructor_id,
                "prerequisites": course.prerequisites,
                "learning_objectives": course.learning_objectives,
                "created_at": course.created_at,
                "updated_at": course.updated_at,
                "student_count": student_count,
                "content_count": content_count
            })
        
        return course_list
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/")
async def create_course(
    course: CourseCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course."""
    try:
        if current_user.role not in ["instructor", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only instructors and admins can create courses"
            )
        
        db_course = Course(
            title=course.title,
            description=course.description,
            category=course.category,
            difficulty_level=course.difficulty_level,
            duration_hours=course.duration_hours,
            price=course.price,
            status=course.status,
            instructor_id=current_user.id,
            is_active=course.is_active
        )
        
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
        
        return {
            "id": db_course.id,
            "title": db_course.title,
            "description": db_course.description,
            "category": db_course.category,
            "duration_hours": db_course.duration_hours,
            "instructor_id": db_course.instructor_id,
            "is_active": db_course.is_active,
            "created_at": db_course.created_at
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{course_id}/publish")
async def publish_course(
    course_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish a course to make it visible to students."""
    try:
        if current_user.role not in ["instructor", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only instructors and admins can publish courses"
            )
        
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        course.status = "published"
        course.is_active = True
        db.commit()
        
        return {
            "id": course.id,
            "title": course.title,
            "status": course.status,
            "is_active": course.is_active,
            "message": "Course published successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}")
async def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.get("/{course_id}/students")
async def get_course_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of students enrolled in course (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Verify instructor owns the course
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found or access denied")
        
        # Get enrolled students
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).all()
        
        student_list = []
        for enrollment in enrollments:
            student = db.query(User).filter(User.id == enrollment.user_id).first()
            if student:
                # Get user profile for name
                profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
                first_name = profile.first_name if profile else "Unknown"
                last_name = profile.last_name if profile else "User"
                
                student_list.append({
                    "id": student.id,
                    "email": student.email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "cscs_card_number": student.cscs_card_number,
                    "is_active": student.is_active,
                    "enrolled_at": enrollment.enrolled_at,
                    "progress": enrollment.progress
                })
        
        return {"students": student_list}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/available-students")
async def get_available_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of students available to be assigned to course (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Verify instructor owns the course
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found or access denied")
        
        # Get all students
        all_students = db.query(User).filter(User.role == "student").all()
        
        # Get enrolled student IDs for this course
        enrolled_student_ids = db.query(Enrollment.user_id).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).all()
        enrolled_ids = [row[0] for row in enrolled_student_ids]
        
        # Filter out already enrolled students
        available_students = [student for student in all_students if student.id not in enrolled_ids]
        
        student_list = []
        for student in available_students:
            # Get user profile for name
            profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
            first_name = profile.first_name if profile else "Unknown"
            last_name = profile.last_name if profile else "User"
            
            student_list.append({
                "id": student.id,
                "email": student.email,
                "first_name": first_name,
                "last_name": last_name,
                "cscs_card_number": student.cscs_card_number,
                "is_active": student.is_active
            })
        
        return {"students": student_list}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
