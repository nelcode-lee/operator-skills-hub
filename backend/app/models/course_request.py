"""
Course request models for student course access requests.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class CourseRequest(Base):
    """Course access request model for students requesting course enrollment."""
    
    __tablename__ = "course_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    request_reason = Column(Text, nullable=True)  # Why the student wants to take this course
    additional_info = Column(Text, nullable=True)  # Any additional information
    status = Column(String(50), default="pending")  # pending, approved, rejected
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin/instructor who reviewed
    review_notes = Column(Text, nullable=True)  # Notes from reviewer
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="course_requests")
    course = relationship("Course", back_populates="course_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by], overlaps="course_requests", viewonly=True)


class CourseRequestForm(Base):
    """Form template for course requests with custom fields."""
    
    __tablename__ = "course_request_forms"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    form_title = Column(String(255), nullable=False)
    form_description = Column(Text, nullable=True)
    required_fields = Column(JSON, nullable=True)  # Custom required fields
    optional_fields = Column(JSON, nullable=True)  # Custom optional fields
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="request_forms")
    creator = relationship("User", foreign_keys=[created_by])

