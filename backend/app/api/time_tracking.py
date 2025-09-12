"""
Time tracking API endpoints for learning sessions.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.learning import LearningTimeTracking, Enrollment
from ..models.user import User
from ..schemas.time_tracking import (
    TimeTrackingStart,
    TimeTrackingUpdate,
    TimeTrackingEnd,
    TimeTrackingResponse,
    TimeTrackingSummary
)

router = APIRouter()


@router.post("/start", response_model=TimeTrackingResponse)
async def start_time_tracking(
    data: TimeTrackingStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start tracking time for a learning session."""
    
    # Check if user is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == data.course_id,
        Enrollment.status == "active"
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course"
        )
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Create new time tracking record
    time_tracking = LearningTimeTracking(
        user_id=current_user.id,
        course_id=data.course_id,
        module_id=data.module_id,
        content_id=data.content_id,
        session_id=session_id,
        time_spent_seconds=0,
        is_active=True,
        started_at=datetime.now(timezone.utc),
        last_activity=datetime.now(timezone.utc),
        tracking_metadata=data.tracking_metadata
    )
    
    db.add(time_tracking)
    db.commit()
    db.refresh(time_tracking)
    
    return TimeTrackingResponse(
        id=time_tracking.id,
        session_id=time_tracking.session_id,
        course_id=time_tracking.course_id,
        module_id=time_tracking.module_id,
        content_id=time_tracking.content_id,
        time_spent_seconds=time_tracking.time_spent_seconds,
        is_active=time_tracking.is_active,
        started_at=time_tracking.started_at,
        last_activity=time_tracking.last_activity
    )


@router.put("/update/{session_id}", response_model=TimeTrackingResponse)
async def update_time_tracking(
    session_id: str,
    data: TimeTrackingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update time tracking for an active session."""
    
    time_tracking = db.query(LearningTimeTracking).filter(
        LearningTimeTracking.session_id == session_id,
        LearningTimeTracking.user_id == current_user.id,
        LearningTimeTracking.is_active == True
    ).first()
    
    if not time_tracking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active time tracking session not found"
        )
    
    # Update time spent and last activity
    time_tracking.time_spent_seconds = data.time_spent_seconds
    time_tracking.last_activity = datetime.now(timezone.utc)
    
    if data.module_id is not None:
        time_tracking.module_id = data.module_id
    if data.content_id is not None:
        time_tracking.content_id = data.content_id
    if data.tracking_metadata is not None:
        time_tracking.tracking_metadata = data.tracking_metadata
    
    db.commit()
    db.refresh(time_tracking)
    
    return TimeTrackingResponse(
        id=time_tracking.id,
        session_id=time_tracking.session_id,
        course_id=time_tracking.course_id,
        module_id=time_tracking.module_id,
        content_id=time_tracking.content_id,
        time_spent_seconds=time_tracking.time_spent_seconds,
        is_active=time_tracking.is_active,
        started_at=time_tracking.started_at,
        last_activity=time_tracking.last_activity
    )


@router.post("/end/{session_id}", response_model=TimeTrackingResponse)
async def end_time_tracking(
    session_id: str,
    data: TimeTrackingEnd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End time tracking for a session."""
    
    time_tracking = db.query(LearningTimeTracking).filter(
        LearningTimeTracking.session_id == session_id,
        LearningTimeTracking.user_id == current_user.id,
        LearningTimeTracking.is_active == True
    ).first()
    
    if not time_tracking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active time tracking session not found"
        )
    
    # Update final time and end session
    time_tracking.time_spent_seconds = data.final_time_spent_seconds
    time_tracking.is_active = False
    time_tracking.ended_at = datetime.now(timezone.utc)
    time_tracking.last_activity = datetime.now(timezone.utc)
    
    if data.tracking_metadata is not None:
        time_tracking.tracking_metadata = data.tracking_metadata
    
    db.commit()
    db.refresh(time_tracking)
    
    return TimeTrackingResponse(
        id=time_tracking.id,
        session_id=time_tracking.session_id,
        course_id=time_tracking.course_id,
        module_id=time_tracking.module_id,
        content_id=time_tracking.content_id,
        time_spent_seconds=time_tracking.time_spent_seconds,
        is_active=time_tracking.is_active,
        started_at=time_tracking.started_at,
        last_activity=time_tracking.last_activity,
        ended_at=time_tracking.ended_at
    )


@router.get("/course/{course_id}/summary", response_model=TimeTrackingSummary)
async def get_course_time_summary(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get time tracking summary for a course."""
    
    # Get all time tracking records for this course and user
    time_records = db.query(LearningTimeTracking).filter(
        LearningTimeTracking.user_id == current_user.id,
        LearningTimeTracking.course_id == course_id
    ).all()
    
    total_time_seconds = sum(record.time_spent_seconds for record in time_records)
    total_sessions = len(time_records)
    active_sessions = len([r for r in time_records if r.is_active])
    
    # Calculate average session time
    avg_session_time = total_time_seconds / total_sessions if total_sessions > 0 else 0
    
    # Get time by module
    module_times = {}
    for record in time_records:
        if record.module_id:
            if record.module_id not in module_times:
                module_times[record.module_id] = 0
            module_times[record.module_id] += record.time_spent_seconds
    
    return TimeTrackingSummary(
        course_id=course_id,
        total_time_seconds=total_time_seconds,
        total_sessions=total_sessions,
        active_sessions=active_sessions,
        average_session_time_seconds=avg_session_time,
        module_times=module_times,
        last_activity=time_records[-1].last_activity if time_records else None
    )


@router.get("/active", response_model=List[TimeTrackingResponse])
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active time tracking sessions for the current user."""
    
    active_sessions = db.query(LearningTimeTracking).filter(
        LearningTimeTracking.user_id == current_user.id,
        LearningTimeTracking.is_active == True
    ).all()
    
    return [
        TimeTrackingResponse(
            id=session.id,
            session_id=session.session_id,
            course_id=session.course_id,
            module_id=session.module_id,
            content_id=session.content_id,
            time_spent_seconds=session.time_spent_seconds,
            is_active=session.is_active,
            started_at=session.started_at,
            last_activity=session.last_activity
        )
        for session in active_sessions
    ]
