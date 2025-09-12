"""
User management models.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    """User model for authentication and basic user information."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # student, instructor, admin
    cscs_card_number = Column(String(50), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Notification preferences
    email_notifications = Column(Boolean, default=True)
    realtime_notifications = Column(Boolean, default=True)
    notification_preferences = Column(JSON, default={
        "messages": True,
        "qa_replies": True,
        "course_updates": True,
        "test_results": True,
        "system": False
    })
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    enrollments = relationship("Enrollment", back_populates="user")
    learning_sessions = relationship("LearningSession", back_populates="user")
    learning_time_tracking = relationship("LearningTimeTracking", back_populates="user")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="user")
    predictive_scores = relationship("PredictiveScore", back_populates="user")
    instructor_metrics = relationship("InstructorMetric", back_populates="instructor")
    course_requests = relationship("CourseRequest", foreign_keys="[CourseRequest.student_id]", back_populates="student")
    
    # Messaging relationships will be added later to avoid circular import issues


class UserProfile(Base):
    """Extended user profile information."""
    
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    qualifications = Column(Text, nullable=True)  # JSON string of qualifications
    profile_image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")

