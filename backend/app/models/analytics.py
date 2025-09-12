"""
Analytics and reporting models for admin dashboard.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class AnalyticsEvent(Base):
    """Track user interactions and system events for analytics."""
    
    __tablename__ = "analytics_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String(100), nullable=False)  # login, course_view, test_complete, etc.
    event_category = Column(String(50), nullable=False)  # user, course, assessment, system
    event_data = Column(JSON, nullable=True)  # Additional event-specific data
    session_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")


class PlatformMetrics(Base):
    """Daily aggregated platform metrics for reporting."""
    
    __tablename__ = "platform_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    
    # User metrics
    total_users = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    new_registrations = Column(Integer, default=0)
    user_retention_rate = Column(Float, default=0.0)
    
    # Course metrics
    total_courses = Column(Integer, default=0)
    active_courses = Column(Integer, default=0)
    course_completions = Column(Integer, default=0)
    average_course_rating = Column(Float, default=0.0)
    
    # Learning metrics
    total_learning_hours = Column(Float, default=0.0)
    average_session_duration = Column(Float, default=0.0)
    assessment_attempts = Column(Integer, default=0)
    assessment_pass_rate = Column(Float, default=0.0)
    
    # Engagement metrics
    total_messages_sent = Column(Integer, default=0)
    qa_posts_created = Column(Integer, default=0)
    notification_sent = Column(Integer, default=0)
    
    # Revenue metrics (if applicable)
    total_revenue = Column(Float, default=0.0)
    course_enrollments = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CourseAnalytics(Base):
    """Detailed analytics for individual courses."""
    
    __tablename__ = "course_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # Enrollment metrics
    total_enrollments = Column(Integer, default=0)
    new_enrollments = Column(Integer, default=0)
    completions = Column(Integer, default=0)
    dropouts = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    
    # Engagement metrics
    total_views = Column(Integer, default=0)
    unique_viewers = Column(Integer, default=0)
    average_time_spent = Column(Float, default=0.0)
    content_interactions = Column(Integer, default=0)
    
    # Assessment metrics
    total_assessments = Column(Integer, default=0)
    passed_assessments = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    retake_rate = Column(Float, default=0.0)
    
    # Feedback metrics
    total_ratings = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course")


class UserEngagementMetrics(Base):
    """User-specific engagement and learning metrics."""
    
    __tablename__ = "user_engagement_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # Activity metrics
    login_count = Column(Integer, default=0)
    session_duration = Column(Float, default=0.0)
    pages_viewed = Column(Integer, default=0)
    
    # Learning metrics
    courses_accessed = Column(Integer, default=0)
    learning_time = Column(Float, default=0.0)
    assessments_completed = Column(Integer, default=0)
    assessments_passed = Column(Integer, default=0)
    
    # Social metrics
    messages_sent = Column(Integer, default=0)
    qa_posts_created = Column(Integer, default=0)
    qa_replies_posted = Column(Integer, default=0)
    
    # Progress metrics
    courses_completed = Column(Integer, default=0)
    certificates_earned = Column(Integer, default=0)
    skill_points_earned = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")


class SystemPerformanceMetrics(Base):
    """System performance and technical metrics."""
    
    __tablename__ = "system_performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    hour = Column(Integer, nullable=False)  # 0-23
    
    # Performance metrics
    average_response_time = Column(Float, default=0.0)
    peak_response_time = Column(Float, default=0.0)
    error_rate = Column(Float, default=0.0)
    uptime_percentage = Column(Float, default=100.0)
    
    # Usage metrics
    api_requests = Column(Integer, default=0)
    database_queries = Column(Integer, default=0)
    cache_hit_rate = Column(Float, default=0.0)
    
    # Resource metrics
    cpu_usage = Column(Float, default=0.0)
    memory_usage = Column(Float, default=0.0)
    disk_usage = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ReportTemplate(Base):
    """Predefined report templates for common analytics needs."""
    
    __tablename__ = "report_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String(50), nullable=False)  # dashboard, detailed, summary
    category = Column(String(50), nullable=False)  # user, course, system, financial
    
    # Report configuration
    metrics = Column(JSON, nullable=False)  # List of metrics to include
    filters = Column(JSON, nullable=True)  # Available filter options
    chart_config = Column(JSON, nullable=True)  # Chart configuration
    export_formats = Column(JSON, nullable=True)  # Available export formats
    
    # Access control
    is_public = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")


class SavedReport(Base):
    """User-saved custom reports."""
    
    __tablename__ = "saved_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Report configuration
    report_type = Column(String(50), nullable=False)
    metrics = Column(JSON, nullable=False)
    filters = Column(JSON, nullable=True)
    date_range = Column(JSON, nullable=True)
    chart_config = Column(JSON, nullable=True)
    
    # Schedule settings
    is_scheduled = Column(Boolean, default=False)
    schedule_frequency = Column(String(20), nullable=True)  # daily, weekly, monthly
    schedule_time = Column(String(10), nullable=True)  # HH:MM format
    last_generated = Column(DateTime(timezone=True), nullable=True)
    next_generation = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")


