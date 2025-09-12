"""
Learning Analytics API Endpoints
Provides detailed analytics and progress tracking for students
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, extract
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.course import Course
from ..models.learning import Enrollment, LearningSession, AssessmentAttempt
from ..models.user import User

router = APIRouter()


class LearningAnalyticsResponse(BaseModel):
    total_courses: int
    completed_courses: int
    overall_progress: float
    total_learning_time_minutes: int
    current_streak_days: int
    achievements_earned: int
    weekly_activity: List[Dict[str, Any]]
    category_progress: List[Dict[str, Any]]
    recent_achievements: List[Dict[str, Any]]
    learning_goals: List[Dict[str, Any]]


@router.get("/analytics", response_model=LearningAnalyticsResponse)
async def get_learning_analytics(
    time_range: str = Query("month", description="Time range: week, month, year"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive learning analytics for the current student."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Calculate date range
    now = datetime.utcnow()
    if time_range == "week":
        start_date = now - timedelta(days=7)
    elif time_range == "month":
        start_date = now - timedelta(days=30)
    elif time_range == "year":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    # Get basic statistics
    total_courses = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).count()
    
    completed_courses = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "completed"
        )
    ).count()
    
    # Calculate overall progress
    enrollments = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status.in_(["active", "completed"])
        )
    ).all()
    
    overall_progress = 0.0
    if enrollments:
        total_progress = sum(enrollment.progress for enrollment in enrollments)
        overall_progress = total_progress / len(enrollments)
    
    # Get total learning time
    learning_sessions = db.query(LearningSession).filter(
        and_(
            LearningSession.user_id == current_user.id,
            LearningSession.started_at >= start_date,
            LearningSession.ended_at.isnot(None)
        )
    ).all()
    
    total_learning_time_minutes = sum(
        session.duration_minutes or 0 for session in learning_sessions
    )
    
    # Calculate current streak (simplified - consecutive days with learning activity)
    current_streak_days = calculate_learning_streak(db, current_user.id)
    
    # Get achievements (simplified - based on completed courses)
    achievements_earned = completed_courses
    
    # Get weekly activity
    weekly_activity = get_weekly_activity(db, current_user.id, start_date, now)
    
    # Get category progress
    category_progress = get_category_progress(db, current_user.id)
    
    # Get recent achievements (simplified)
    recent_achievements = get_recent_achievements(db, current_user.id, completed_courses)
    
    # Get learning goals (simplified - based on course completion targets)
    learning_goals = get_learning_goals(db, current_user.id, enrollments)
    
    return LearningAnalyticsResponse(
        total_courses=total_courses,
        completed_courses=completed_courses,
        overall_progress=round(overall_progress, 2),
        total_learning_time_minutes=total_learning_time_minutes,
        current_streak_days=current_streak_days,
        achievements_earned=achievements_earned,
        weekly_activity=weekly_activity,
        category_progress=category_progress,
        recent_achievements=recent_achievements,
        learning_goals=learning_goals
    )


def calculate_learning_streak(db: Session, user_id: int) -> int:
    """Calculate current learning streak in days."""
    # Get all learning sessions for the user
    sessions = db.query(LearningSession).filter(
        and_(
            LearningSession.user_id == user_id,
            LearningSession.ended_at.isnot(None)
        )
    ).order_by(desc(LearningSession.started_at)).all()
    
    if not sessions:
        return 0
    
    # Group sessions by date
    session_dates = set()
    for session in sessions:
        session_date = session.started_at.date()
        session_dates.add(session_date)
    
    # Calculate consecutive days
    streak = 0
    current_date = datetime.utcnow().date()
    
    while current_date in session_dates:
        streak += 1
        current_date -= timedelta(days=1)
    
    return streak


def get_weekly_activity(db: Session, user_id: int, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Get weekly learning activity data."""
    # Get learning sessions in the date range
    sessions = db.query(LearningSession).filter(
        and_(
            LearningSession.user_id == user_id,
            LearningSession.started_at >= start_date,
            LearningSession.started_at <= end_date,
            LearningSession.ended_at.isnot(None)
        )
    ).all()
    
    # Group by date
    daily_activity = {}
    for session in sessions:
        date_key = session.started_at.date().isoformat()
        if date_key not in daily_activity:
            daily_activity[date_key] = {
                "date": date_key,
                "minutes": 0,
                "courses_accessed": set()
            }
        
        daily_activity[date_key]["minutes"] += session.duration_minutes or 0
        daily_activity[date_key]["courses_accessed"].add(session.course_id)
    
    # Convert sets to counts and sort by date
    weekly_activity = []
    for date_key in sorted(daily_activity.keys()):
        activity = daily_activity[date_key]
        weekly_activity.append({
            "date": activity["date"],
            "minutes": activity["minutes"],
            "courses_accessed": len(activity["courses_accessed"])
        })
    
    return weekly_activity


def get_category_progress(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """Get progress by course category."""
    # Get enrollments with course information
    enrollments = db.query(Enrollment, Course).join(
        Course, Enrollment.course_id == Course.id
    ).filter(
        and_(
            Enrollment.user_id == user_id,
            Enrollment.status.in_(["active", "completed"])
        )
    ).all()
    
    # Group by category
    category_stats = {}
    for enrollment, course in enrollments:
        category = course.category
        if category not in category_stats:
            category_stats[category] = {
                "category": category,
                "courses_enrolled": 0,
                "courses_completed": 0,
                "total_progress": 0
            }
        
        category_stats[category]["courses_enrolled"] += 1
        if enrollment.status == "completed":
            category_stats[category]["courses_completed"] += 1
        
        category_stats[category]["total_progress"] += enrollment.progress
    
    # Calculate percentages
    category_progress = []
    for category, stats in category_stats.items():
        progress_percentage = stats["total_progress"] / stats["courses_enrolled"] if stats["courses_enrolled"] > 0 else 0
        category_progress.append({
            "category": category,
            "courses_enrolled": stats["courses_enrolled"],
            "courses_completed": stats["courses_completed"],
            "progress_percentage": round(progress_percentage, 2)
        })
    
    return category_progress


def get_recent_achievements(db: Session, user_id: int, completed_courses: int) -> List[Dict[str, Any]]:
    """Get recent achievements (simplified implementation)."""
    achievements = []
    
    # Course completion achievements
    if completed_courses >= 1:
        achievements.append({
            "id": 1,
            "title": "First Course Complete",
            "description": "Completed your first course",
            "earned_at": datetime.utcnow().isoformat(),
            "icon": "trophy"
        })
    
    if completed_courses >= 5:
        achievements.append({
            "id": 2,
            "title": "Learning Enthusiast",
            "description": "Completed 5 courses",
            "earned_at": datetime.utcnow().isoformat(),
            "icon": "star"
        })
    
    if completed_courses >= 10:
        achievements.append({
            "id": 3,
            "title": "Knowledge Seeker",
            "description": "Completed 10 courses",
            "earned_at": datetime.utcnow().isoformat(),
            "icon": "award"
        })
    
    return achievements


def get_learning_goals(db: Session, user_id: int, enrollments: List[Enrollment]) -> List[Dict[str, Any]]:
    """Get learning goals (simplified implementation)."""
    goals = []
    
    # Active courses goal
    active_courses = len([e for e in enrollments if e.status == "active"])
    goals.append({
        "id": 1,
        "title": "Complete Active Courses",
        "target": len(enrollments),
        "current": completed_courses,
        "deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "status": "on_track" if completed_courses >= len(enrollments) * 0.5 else "at_risk"
    })
    
    # Learning time goal
    total_time = sum(session.duration_minutes or 0 for session in db.query(LearningSession).filter(
        LearningSession.user_id == user_id
    ).all())
    
    goals.append({
        "id": 2,
        "title": "Learning Time Target",
        "target": 1000,  # 1000 minutes
        "current": total_time,
        "deadline": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "status": "on_track" if total_time >= 500 else "at_risk"
    })
    
    return goals


@router.get("/progress-summary")
async def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a quick progress summary for dashboard widgets."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get basic stats
    total_courses = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).count()
    
    completed_courses = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "completed"
        )
    ).count()
    
    # Get this week's learning time
    week_start = datetime.utcnow() - timedelta(days=7)
    weekly_sessions = db.query(LearningSession).filter(
        and_(
            LearningSession.user_id == current_user.id,
            LearningSession.started_at >= week_start,
            LearningSession.ended_at.isnot(None)
        )
    ).all()
    
    weekly_learning_time = sum(session.duration_minutes or 0 for session in weekly_sessions)
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "completion_rate": (completed_courses / total_courses * 100) if total_courses > 0 else 0,
        "weekly_learning_time": weekly_learning_time,
        "current_streak": calculate_learning_streak(db, current_user.id)
    }
