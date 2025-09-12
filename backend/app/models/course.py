"""
Course management models.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Course(Base):
    """Course model for training courses."""
    
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)  # e.g., "CSCS", "Health & Safety", "Technical"
    difficulty_level = Column(String(50), nullable=True)  # beginner, intermediate, advanced
    duration_hours = Column(Float, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="draft")  # draft, published, archived
    is_active = Column(Boolean, default=True)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prerequisites = Column(JSON, nullable=True)  # List of required qualifications
    learning_objectives = Column(JSON, nullable=True)  # List of learning objectives
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    modules = relationship("CourseModule", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")
    learning_time_tracking = relationship("LearningTimeTracking", back_populates="course")
    course_requests = relationship("CourseRequest", back_populates="course")
    request_forms = relationship("CourseRequestForm", back_populates="course")


class CourseModule(Base):
    """Course module model for organizing course content."""
    
    __tablename__ = "course_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    content_type = Column(String(50), nullable=False)  # video, text, interactive, assessment
    estimated_duration_minutes = Column(Integer, nullable=True)
    is_required = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="modules")
    content = relationship("CourseContent", back_populates="module", cascade="all, delete-orphan")


class CourseContent(Base):
    """Course content model for storing actual content."""
    
    __tablename__ = "course_content"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("course_modules.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)  # Text content or HTML
    content_type = Column(String(50), nullable=False)  # text, video, image, document, interactive
    media_urls = Column(JSON, nullable=True)  # List of media file URLs
    order = Column(Integer, nullable=False)
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    module = relationship("CourseModule", back_populates="content")


class CourseFileContent(Base):
    """Course content model for PDF and other file content."""
    
    __tablename__ = "course_content_files"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String(50), nullable=False, default="pdf")  # pdf, video, document
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    file_metadata = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course")
    instructor = relationship("User")
