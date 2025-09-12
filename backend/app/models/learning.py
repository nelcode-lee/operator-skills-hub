"""
Learning and progress tracking models.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Enrollment(Base):
    """Student course enrollment model."""
    
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    progress = Column(Float, default=0.0)  # Percentage completion (0-100)
    status = Column(String(50), default="active")  # active, completed, suspended, withdrawn
    completion_date = Column(DateTime(timezone=True), nullable=True)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    learning_sessions = relationship("LearningSession", back_populates="enrollment")


class LearningSession(Base):
    """Learning session tracking model."""
    
    __tablename__ = "learning_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    completed_modules = Column(JSON, nullable=True)  # List of completed module IDs
    session_data = Column(JSON, nullable=True)  # Additional session metadata
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="learning_sessions")
    enrollment = relationship("Enrollment", back_populates="learning_sessions")


class Assessment(Base):
    """Assessment model for course evaluations."""
    
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    passing_score = Column(Integer, nullable=False)  # Percentage required to pass
    time_limit_minutes = Column(Integer, nullable=True)
    total_questions = Column(Integer, nullable=False)
    attempts_allowed = Column(Integer, default=-1)  # -1 means unlimited
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="assessments")
    questions = relationship("AssessmentQuestion", back_populates="assessment")
    attempts = relationship("AssessmentAttempt", back_populates="assessment")


class AssessmentQuestion(Base):
    """Individual questions within an assessment."""
    
    __tablename__ = "assessment_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # multiple_choice, true_false, fill_blank
    options = Column(JSON, nullable=True)  # For multiple choice questions
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=1)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assessment = relationship("Assessment", back_populates="questions")


class AssessmentAttempt(Base):
    """Student assessment attempt model."""
    
    __tablename__ = "assessment_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    score = Column(Integer, nullable=False)  # Points earned
    total_score = Column(Integer, nullable=False)  # Total possible points
    percentage = Column(Float, nullable=False)  # Percentage score
    passed = Column(Boolean, nullable=False)
    answers = Column(JSON, nullable=True)  # Student's answers
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    time_taken_minutes = Column(Integer, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="assessment_attempts")
    assessment = relationship("Assessment", back_populates="attempts")


class LearningTimeTracking(Base):
    """Time tracking for learning sessions."""
    
    __tablename__ = "learning_time_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    module_id = Column(Integer, nullable=True)  # Optional module tracking
    content_id = Column(Integer, nullable=True)  # Optional content tracking
    session_id = Column(String(100), nullable=False)  # Frontend session identifier
    time_spent_seconds = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)  # Whether session is currently active
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    tracking_metadata = Column(JSON, nullable=True)  # Additional tracking data
    
    # Relationships
    user = relationship("User", back_populates="learning_time_tracking")
    course = relationship("Course", back_populates="learning_time_tracking")

