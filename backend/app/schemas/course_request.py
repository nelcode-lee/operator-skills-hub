"""
Course request schemas.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.course_request import RequestStatus

class CourseRequestCreate(BaseModel):
    course_id: int
    message: Optional[str] = None

class CourseRequestUpdate(BaseModel):
    status: RequestStatus
    instructor_response: Optional[str] = None

class CourseRequestResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    status: RequestStatus
    message: Optional[str] = None
    instructor_response: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True