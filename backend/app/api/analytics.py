"""
Analytics and reporting API endpoints for admin dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.analytics import (
    AnalyticsEvent, PlatformMetrics, CourseAnalytics, 
    UserEngagementMetrics, SystemPerformanceMetrics,
    ReportTemplate, SavedReport
)
from ..models.course import Course
from ..models.learning import Enrollment, LearningSession, AssessmentAttempt

router = APIRouter(tags=["Analytics & Reporting"])


# Helper functions for data aggregation
def get_date_range(days: int = 30) -> tuple[date, date]:
    """Get date range for analytics queries."""
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def calculate_user_retention_rate(db: Session, start_date: date, end_date: date) -> float:
    """Calculate user retention rate for the given period."""
    # Get users who registered before the start date
    total_users = db.query(User).filter(
        User.created_at < start_date,
        User.is_active == True
    ).count()
    
    if total_users == 0:
        return 0.0
    
    # Get users who were active during the period
    active_users = db.query(User).filter(
        User.created_at < start_date,
        User.is_active == True,
        User.updated_at >= start_date
    ).count()
    
    return (active_users / total_users) * 100 if total_users > 0 else 0.0


# Platform Overview Metrics
@router.get("/overview")
async def get_platform_overview(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get platform overview metrics for admin dashboard."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    start_date, end_date = get_date_range(days)
    
    # User metrics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(
        User.is_active == True,
        User.updated_at >= start_date
    ).count()
    new_registrations = db.query(User).filter(
        User.created_at >= start_date
    ).count()
    retention_rate = calculate_user_retention_rate(db, start_date, end_date)
    
    # Course metrics
    total_courses = db.query(Course).count()
    active_courses = db.query(Course).filter(
        Course.is_active == True,
        Course.status == "published"
    ).count()
    
    # Enrollment metrics
    total_enrollments = db.query(Enrollment).filter(
        Enrollment.created_at >= start_date
    ).count()
    
    completed_enrollments = db.query(Enrollment).filter(
        Enrollment.status == "completed",
        Enrollment.updated_at >= start_date
    ).count()
    
    # Learning metrics
    total_learning_hours = db.query(func.sum(LearningSession.duration_minutes)).filter(
        LearningSession.created_at >= start_date
    ).scalar() or 0
    total_learning_hours = total_learning_hours / 60  # Convert to hours
    
    # Assessment metrics
    total_assessments = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.created_at >= start_date
    ).count()
    
    passed_assessments = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.passed == True,
        AssessmentAttempt.created_at >= start_date
    ).count()
    
    pass_rate = (passed_assessments / total_assessments * 100) if total_assessments > 0 else 0
    
    # Engagement metrics
    total_messages = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.event_type == "message_sent",
        AnalyticsEvent.created_at >= start_date
    ).count()
    
    total_qa_posts = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.event_type == "qa_post_created",
        AnalyticsEvent.created_at >= start_date
    ).count()
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "new_registrations": new_registrations,
            "retention_rate": round(retention_rate, 2)
        },
        "courses": {
            "total": total_courses,
            "active": active_courses,
            "enrollments": total_enrollments,
            "completions": completed_enrollments
        },
        "learning": {
            "total_hours": round(total_learning_hours, 2),
            "assessments_attempted": total_assessments,
            "assessments_passed": passed_assessments,
            "pass_rate": round(pass_rate, 2)
        },
        "engagement": {
            "messages_sent": total_messages,
            "qa_posts_created": total_qa_posts
        }
    }


# Course Analytics
@router.get("/courses")
async def get_course_analytics(
    course_id: Optional[int] = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed course analytics."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    start_date, end_date = get_date_range(days)
    
    query = db.query(Course).options(joinedload(Course.enrollments))
    
    if course_id:
        query = query.filter(Course.id == course_id)
    
    courses = query.all()
    
    course_analytics = []
    for course in courses:
        # Enrollment metrics
        total_enrollments = len(course.enrollments)
        recent_enrollments = len([
            e for e in course.enrollments 
            if e.created_at.date() >= start_date
        ])
        completions = len([
            e for e in course.enrollments 
            if e.status == "completed"
        ])
        completion_rate = (completions / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Learning sessions for this course
        learning_sessions = db.query(LearningSession).join(Enrollment).filter(
            Enrollment.course_id == course.id,
            LearningSession.created_at >= start_date
        ).all()
        
        total_learning_time = sum(session.duration_minutes for session in learning_sessions) / 60
        unique_learners = len(set(session.user_id for session in learning_sessions))
        
        # Assessment attempts for this course
        assessment_attempts = db.query(AssessmentAttempt).join(Enrollment).filter(
            Enrollment.course_id == course.id,
            AssessmentAttempt.created_at >= start_date
        ).all()
        
        total_attempts = len(assessment_attempts)
        passed_attempts = len([a for a in assessment_attempts if a.passed])
        avg_score = sum(a.score for a in assessment_attempts) / total_attempts if total_attempts > 0 else 0
        
        course_analytics.append({
            "course_id": course.id,
            "course_title": course.title,
            "category": course.category,
            "difficulty_level": course.difficulty_level,
            "status": course.status,
            "enrollments": {
                "total": total_enrollments,
                "recent": recent_enrollments,
                "completions": completions,
                "completion_rate": round(completion_rate, 2)
            },
            "learning": {
                "total_hours": round(total_learning_time, 2),
                "unique_learners": unique_learners,
                "average_session_duration": round(total_learning_time / len(learning_sessions), 2) if learning_sessions else 0
            },
            "assessments": {
                "total_attempts": total_attempts,
                "passed_attempts": passed_attempts,
                "pass_rate": round((passed_attempts / total_attempts * 100), 2) if total_attempts > 0 else 0,
                "average_score": round(avg_score, 2)
            }
        })
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "courses": course_analytics
    }


# User Engagement Analytics
@router.get("/users/engagement")
async def get_user_engagement_analytics(
    days: int = Query(30, ge=1, le=365),
    user_role: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user engagement analytics."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    start_date, end_date = get_date_range(days)
    
    query = db.query(User)
    if user_role:
        query = query.filter(User.role == user_role)
    
    users = query.all()
    
    engagement_data = []
    for user in users:
        # Learning sessions
        learning_sessions = db.query(LearningSession).filter(
            LearningSession.user_id == user.id,
            LearningSession.created_at >= start_date
        ).all()
        
        total_learning_time = sum(session.duration_minutes for session in learning_sessions) / 60
        session_count = len(learning_sessions)
        
        # Assessment attempts
        assessment_attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.user_id == user.id,
            AssessmentAttempt.created_at >= start_date
        ).all()
        
        passed_assessments = len([a for a in assessment_attempts if a.passed])
        avg_score = sum(a.score for a in assessment_attempts) / len(assessment_attempts) if assessment_attempts else 0
        
        # Enrollments
        enrollments = db.query(Enrollment).filter(
            Enrollment.user_id == user.id,
            Enrollment.created_at >= start_date
        ).all()
        
        completed_courses = len([e for e in enrollments if e.status == "completed"])
        
        # Analytics events for engagement
        login_events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.user_id == user.id,
            AnalyticsEvent.event_type == "login",
            AnalyticsEvent.created_at >= start_date
        ).count()
        
        engagement_data.append({
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "engagement": {
                "login_count": login_events,
                "learning_hours": round(total_learning_time, 2),
                "session_count": session_count,
                "courses_enrolled": len(enrollments),
                "courses_completed": completed_courses,
                "assessments_attempted": len(assessment_attempts),
                "assessments_passed": passed_assessments,
                "average_score": round(avg_score, 2)
            }
        })
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "users": engagement_data
    }


# Time Series Data
@router.get("/timeseries")
async def get_timeseries_data(
    metric: str = Query(..., description="Metric to retrieve: users, enrollments, completions, learning_hours"),
    days: int = Query(30, ge=1, le=365),
    granularity: str = Query("daily", description="daily, weekly, monthly"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get time series data for charts and trends."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    start_date, end_date = get_date_range(days)
    
    # Determine date grouping based on granularity
    if granularity == "daily":
        date_format = "%Y-%m-%d"
        date_trunc = "day"
    elif granularity == "weekly":
        date_format = "%Y-%U"  # Year-Week
        date_trunc = "week"
    elif granularity == "monthly":
        date_format = "%Y-%m"
        date_trunc = "month"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid granularity. Use: daily, weekly, monthly"
        )
    
    timeseries_data = []
    
    if metric == "users":
        # New user registrations over time
        result = db.query(
            func.date_trunc(date_trunc, User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(
            User.created_at >= start_date
        ).group_by(
            func.date_trunc(date_trunc, User.created_at)
        ).order_by('date').all()
        
        timeseries_data = [{"date": row.date.isoformat(), "value": row.count} for row in result]
    
    elif metric == "enrollments":
        # Course enrollments over time
        result = db.query(
            func.date_trunc(date_trunc, Enrollment.created_at).label('date'),
            func.count(Enrollment.id).label('count')
        ).filter(
            Enrollment.created_at >= start_date
        ).group_by(
            func.date_trunc(date_trunc, Enrollment.created_at)
        ).order_by('date').all()
        
        timeseries_data = [{"date": row.date.isoformat(), "value": row.count} for row in result]
    
    elif metric == "completions":
        # Course completions over time
        result = db.query(
            func.date_trunc(date_trunc, Enrollment.updated_at).label('date'),
            func.count(Enrollment.id).label('count')
        ).filter(
            Enrollment.status == "completed",
            Enrollment.updated_at >= start_date
        ).group_by(
            func.date_trunc(date_trunc, Enrollment.updated_at)
        ).order_by('date').all()
        
        timeseries_data = [{"date": row.date.isoformat(), "value": row.count} for row in result]
    
    elif metric == "learning_hours":
        # Learning hours over time
        result = db.query(
            func.date_trunc(date_trunc, LearningSession.created_at).label('date'),
            func.sum(LearningSession.duration_minutes).label('total_minutes')
        ).filter(
            LearningSession.created_at >= start_date
        ).group_by(
            func.date_trunc(date_trunc, LearningSession.created_at)
        ).order_by('date').all()
        
        timeseries_data = [
            {"date": row.date.isoformat(), "value": round(row.total_minutes / 60, 2)} 
            for row in result
        ]
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid metric. Use: users, enrollments, completions, learning_hours"
        )
    
    return {
        "metric": metric,
        "granularity": granularity,
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days
        },
        "data": timeseries_data
    }


# Export functionality
@router.get("/export")
async def export_analytics_data(
    format: str = Query("csv", description="Export format: csv, json"),
    metric: str = Query("overview", description="Data to export"),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analytics data in various formats."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get data based on metric type
    if metric == "overview":
        data = await get_platform_overview(days, current_user, db)
    elif metric == "courses":
        data = await get_course_analytics(None, days, current_user, db)
    elif metric == "users":
        data = await get_user_engagement_analytics(days, None, current_user, db)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid metric for export"
        )
    
    if format == "csv":
        # Convert data to CSV format
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Flatten the data structure for CSV
        if metric == "overview":
            writer.writerow(["Metric", "Value"])
            for category, metrics in data.items():
                if isinstance(metrics, dict):
                    for key, value in metrics.items():
                        writer.writerow([f"{category}_{key}", value])
        
        csv_content = output.getvalue()
        output.close()
        
        return {
            "content": csv_content,
            "filename": f"analytics_{metric}_{days}days.csv",
            "content_type": "text/csv"
        }
    
    elif format == "json":
        return {
            "content": data,
            "filename": f"analytics_{metric}_{days}days.json",
            "content_type": "application/json"
        }
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Use: csv, json"
        )


# Report Templates
@router.get("/templates")
async def get_report_templates(
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available report templates."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = db.query(ReportTemplate).filter(
        or_(ReportTemplate.is_public == True, ReportTemplate.created_by == current_user.id)
    )
    
    if category:
        query = query.filter(ReportTemplate.category == category)
    
    templates = query.all()
    
    return [
        {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "report_type": template.report_type,
            "category": template.category,
            "metrics": template.metrics,
            "filters": template.filters,
            "export_formats": template.export_formats,
            "is_public": template.is_public,
            "created_at": template.created_at.isoformat()
        }
        for template in templates
    ]


# Save Custom Report
@router.post("/reports/save")
async def save_custom_report(
    report_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a custom report configuration."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    saved_report = SavedReport(
        name=report_data.get("name"),
        description=report_data.get("description"),
        user_id=current_user.id,
        report_type=report_data.get("report_type"),
        metrics=report_data.get("metrics"),
        filters=report_data.get("filters"),
        date_range=report_data.get("date_range"),
        chart_config=report_data.get("chart_config"),
        is_scheduled=report_data.get("is_scheduled", False),
        schedule_frequency=report_data.get("schedule_frequency"),
        schedule_time=report_data.get("schedule_time")
    )
    
    db.add(saved_report)
    db.commit()
    db.refresh(saved_report)
    
    return {
        "id": saved_report.id,
        "message": "Report saved successfully"
    }


# Get Saved Reports
@router.get("/reports/saved")
async def get_saved_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's saved reports."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    reports = db.query(SavedReport).filter(
        SavedReport.user_id == current_user.id
    ).all()
    
    return [
        {
            "id": report.id,
            "name": report.name,
            "description": report.description,
            "report_type": report.report_type,
            "metrics": report.metrics,
            "filters": report.filters,
            "is_scheduled": report.is_scheduled,
            "last_generated": report.last_generated.isoformat() if report.last_generated else None,
            "created_at": report.created_at.isoformat()
        }
        for report in reports
    ]






