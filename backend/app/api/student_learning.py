"""
Student learning API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.course import Course, CourseFileContent
from ..models.learning import Enrollment, LearningSession, Assessment, AssessmentAttempt
from ..models.user import User
from ..schemas.learning import (
    StudentCourseResponse,
    LearningSessionCreate,
    LearningSessionResponse,
    ContentResponse,
    LearningProgressResponse
)

router = APIRouter()


@router.get("/my-courses", response_model=List[StudentCourseResponse])
async def get_my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get courses enrolled by the current student."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get enrolled courses
    enrollments = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "active"
        )
    ).all()
    
    courses = []
    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if course:
            # Calculate progress
            total_content = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course.id,
                CourseFileContent.is_active == True
            ).count()
            
            completed_sessions = db.query(LearningSession).filter(
                and_(
                    LearningSession.user_id == current_user.id,
                    LearningSession.course_id == course.id,
                    LearningSession.ended_at.isnot(None)
                )
            ).count()
            
            progress_percentage = (completed_sessions / total_content * 100) if total_content > 0 else 0
            
            # Get last accessed time
            last_session = db.query(LearningSession).filter(
                and_(
                    LearningSession.user_id == current_user.id,
                    LearningSession.course_id == course.id
                )
            ).order_by(desc(LearningSession.started_at)).first()
            
            last_accessed = last_session.started_at if last_session else enrollment.created_at
            
            courses.append(StudentCourseResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                category=course.category,
                duration_hours=course.duration_hours,
                difficulty_level=course.difficulty_level,
                progress_percentage=round(progress_percentage, 2),
                enrolled_at=enrollment.created_at,
                last_accessed=last_accessed,
                status="active" if progress_percentage < 100 else "completed"
            ))
    
    return courses


@router.get("/courses/{course_id}/content", response_model=List[ContentResponse])
async def get_course_content(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get content for a specific course."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Check if student is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course."
        )
    
    # Get course content
    content_files = db.query(CourseFileContent).filter(
        and_(
            CourseFileContent.course_id == course_id,
            CourseFileContent.is_active == True
        )
    ).all()
    
    content_list = []
    for content in content_files:
        # Simplified content response without complex session tracking
        content_list.append(ContentResponse(
            id=content.id,
            title=content.title,
            content_type=content.content_type,
            description=content.description or "",
            file_path=content.file_path,
            duration_minutes=content.page_count * 2 if content.page_count else 30,  # Estimate 2 minutes per page
            is_completed=False,  # Simplified for now
            completion_percentage=0.0,  # Simplified for now
            last_accessed=None  # Simplified for now
        ))
    
    return content_list


@router.get("/content/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific content details."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    content = db.query(CourseFileContent).filter(
        and_(
            CourseFileContent.id == content_id,
            CourseFileContent.is_active == True
        )
    ).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )
    
    # Check if student has access to this content
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == content.course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this content."
        )
    
    # Check completion status
    completed_session = db.query(LearningSession).filter(
        and_(
            LearningSession.user_id == current_user.id,
            LearningSession.content_id == content_id,
            LearningSession.ended_at.isnot(None)
        )
    ).first()
    
    is_completed = completed_session is not None
    completion_percentage = 100 if is_completed else 0
    
    # Get course title
    course = db.query(Course).filter(Course.id == content.course_id).first()
    
    return ContentResponse(
        id=content.id,
        title=content.title,
        content_type=content.content_type,
        description=content.description,
        file_path=content.file_path,
        duration_minutes=content.page_count * 2,
        is_completed=is_completed,
        completion_percentage=completion_percentage,
        course_id=content.course_id,
        course_title=course.title if course else "Unknown Course"
    )


@router.post("/sessions/start", response_model=LearningSessionResponse)
async def start_learning_session(
    session_data: LearningSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new learning session."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Check if content exists and user has access
    content = db.query(CourseFileContent).filter(
        and_(
            CourseFileContent.id == session_data.content_id,
            CourseFileContent.is_active == True
        )
    ).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )
    
    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == content.course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this content."
        )
    
    # Create new learning session
    session = LearningSession(
        user_id=current_user.id,
        course_id=content.course_id,
        duration_minutes=0,  # Will be updated when session ends
        started_at=datetime.utcnow()
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return LearningSessionResponse(
        id=session.id,
        user_id=session.user_id,
        course_id=session.course_id,
        content_id=session_data.content_id,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_minutes=session.duration_minutes,
        progress_percentage=0.0  # Will be calculated based on progress
    )


@router.post("/sessions/{session_id}/end", response_model=LearningSessionResponse)
async def end_learning_session(
    session_id: int,
    session_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """End a learning session."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    session = db.query(LearningSession).filter(
        and_(
            LearningSession.id == session_id,
            LearningSession.user_id == current_user.id,
            LearningSession.ended_at.is_(None)
        )
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active learning session not found."
        )
    
    # Update session
    session.ended_at = datetime.utcnow()
    session.duration_minutes = session_data.get("duration_minutes", 0)
    # Store progress in session_data JSON field
    if not session.session_data:
        session.session_data = {}
    session.session_data["progress_percentage"] = session_data.get("progress_percentage", 100)
    
    db.commit()
    db.refresh(session)
    
    return LearningSessionResponse(
        id=session.id,
        user_id=session.user_id,
        course_id=session.course_id,
        content_id=session_data.get("content_id"),
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_minutes=session.duration_minutes,
        progress_percentage=session.session_data.get("progress_percentage", 0.0) if session.session_data else 0.0
    )


@router.get("/my-sessions", response_model=List[LearningSessionResponse])
async def get_my_sessions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent learning sessions for the current student."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == current_user.id
    ).order_by(desc(LearningSession.started_at)).limit(limit).all()
    
    return [
        LearningSessionResponse(
            id=session.id,
            user_id=session.user_id,
            course_id=session.course_id,
            content_id=None,  # Not stored in session model
            started_at=session.started_at,
            ended_at=session.ended_at,
            duration_minutes=session.duration_minutes,
            progress_percentage=session.session_data.get("progress_percentage", 0.0) if session.session_data else 0.0
        )
        for session in sessions
    ]


@router.get("/content/{content_id}/view")
async def view_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """View specific content - returns content details for the viewer."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get content
    content = db.query(CourseFileContent).filter(
        and_(
            CourseFileContent.id == content_id,
            CourseFileContent.is_active == True
        )
    ).first()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found."
        )
    
    # Check if student has access to this content
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == content.course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this content."
        )
    
    # Get course title
    course = db.query(Course).filter(Course.id == content.course_id).first()
    
    return {
        "content_id": content.id,
        "title": content.title,
        "description": content.description,
        "content_type": content.content_type,
        "file_path": content.file_path,
        "page_count": content.page_count,
        "course_id": content.course_id,
        "course_title": course.title if course else "Unknown Course",
        "viewer_url": f"/api/courses/{content.course_id}/content/{content_id}/pdf-viewer",
        "download_url": f"/api/courses/{content.course_id}/content/{content_id}/download"
    }


@router.get("/progress", response_model=LearningProgressResponse)
async def get_learning_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall learning progress for the current student."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get enrolled courses
    enrollments = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "active"
        )
    ).all()
    
    total_courses = len(enrollments)
    completed_courses = 0
    total_learning_time = 0
    
    for enrollment in enrollments:
        # Check if course is completed
        total_content = db.query(CourseFileContent).filter(
            CourseFileContent.course_id == enrollment.course_id,
            CourseFileContent.is_active == True
        ).count()
        
        completed_sessions = db.query(LearningSession).filter(
            and_(
                LearningSession.user_id == current_user.id,
                LearningSession.course_id == enrollment.course_id,
                LearningSession.ended_at.isnot(None)
            )
        ).count()
        
        if completed_sessions >= total_content and total_content > 0:
            completed_courses += 1
        
        # Calculate total learning time
        course_sessions = db.query(LearningSession).filter(
            and_(
                LearningSession.user_id == current_user.id,
                LearningSession.course_id == enrollment.course_id,
                LearningSession.ended_at.isnot(None)
            )
        ).all()
        
        for session in course_sessions:
            total_learning_time += session.duration_minutes or 0
    
    overall_progress = (completed_courses / total_courses * 100) if total_courses > 0 else 0
    
    return LearningProgressResponse(
        total_courses=total_courses,
        completed_courses=completed_courses,
        overall_progress=round(overall_progress, 2),
        total_learning_time_minutes=total_learning_time,
        current_streak_days=0,  # TODO: Implement streak calculation
        achievements_earned=0   # TODO: Implement achievements
    )

