"""
Course Request Pydantic schemas
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class CourseRequestCreate(BaseModel):
    """Schema for creating a course request"""
    course_id: int
    request_reason: str
    additional_info: Optional[str] = None


class CourseRequestReview(BaseModel):
    """Schema for reviewing a course request"""
    status: str  # "approved" or "rejected"
    review_notes: Optional[str] = None


class CourseRequestResponse(BaseModel):
    """Schema for course request response"""
    id: int
    student_id: int
    course_id: int
    request_reason: Optional[str]
    additional_info: Optional[str]
    status: str
    reviewed_by: Optional[int]
    review_notes: Optional[str]
    requested_at: datetime
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Include course and student details
    course_title: Optional[str] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class CourseRequestFormCreate(BaseModel):
    """Schema for creating a course request form"""
    form_title: str
    form_description: Optional[str] = None
    required_fields: Optional[List[str]] = None
    optional_fields: Optional[List[str]] = None


class CourseRequestFormResponse(BaseModel):
    """Schema for course request form response"""
    id: int
    course_id: int
    form_title: str
    form_description: Optional[str]
    required_fields: Optional[List[str]]
    optional_fields: Optional[List[str]]
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True



