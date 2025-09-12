"""
AI and analytics models.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class ContentGeneration(Base):
    """AI content generation tracking model."""
    
    __tablename__ = "content_generations"
    
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    generated_content = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=False)  # e.g., "gpt-4", "gpt-3.5-turbo"
    content_type = Column(String(50), nullable=False)  # lesson_plan, assessment, content
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    approver = relationship("User", foreign_keys=[approved_by])


class PredictiveScore(Base):
    """Student performance prediction model."""
    
    __tablename__ = "predictive_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    risk_score = Column(Float, nullable=False)  # 0-1 scale, higher = more at risk
    confidence_level = Column(Float, nullable=False)  # 0-1 scale
    features_used = Column(JSON, nullable=True)  # Features used in prediction
    intervention_suggested = Column(String(100), nullable=True)  # Type of intervention
    intervention_applied = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="predictive_scores")


class InstructorMetric(Base):
    """Instructor performance metrics model."""
    
    __tablename__ = "instructor_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    pass_rate = Column(Float, nullable=False)  # Percentage of students who passed
    student_satisfaction = Column(Float, nullable=True)  # Average satisfaction score
    completion_rate = Column(Float, nullable=False)  # Percentage who completed course
    average_grade = Column(Float, nullable=True)  # Average assessment score
    total_students = Column(Integer, nullable=False)
    metrics_data = Column(JSON, nullable=True)  # Additional metrics
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    instructor = relationship("User", back_populates="instructor_metrics")

