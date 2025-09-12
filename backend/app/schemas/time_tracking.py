"""
Time tracking Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class TimeTrackingStart(BaseModel):
    """Schema for starting time tracking."""
    course_id: int
    module_id: Optional[int] = None
    content_id: Optional[int] = None
    tracking_metadata: Optional[Dict[str, Any]] = None


class TimeTrackingUpdate(BaseModel):
    """Schema for updating time tracking."""
    time_spent_seconds: int
    module_id: Optional[int] = None
    content_id: Optional[int] = None
    tracking_metadata: Optional[Dict[str, Any]] = None


class TimeTrackingEnd(BaseModel):
    """Schema for ending time tracking."""
    final_time_spent_seconds: int
    tracking_metadata: Optional[Dict[str, Any]] = None


class TimeTrackingResponse(BaseModel):
    """Schema for time tracking response."""
    id: int
    session_id: str
    course_id: int
    module_id: Optional[int] = None
    content_id: Optional[int] = None
    time_spent_seconds: int
    is_active: bool
    started_at: datetime
    last_activity: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TimeTrackingSummary(BaseModel):
    """Schema for time tracking summary."""
    course_id: int
    total_time_seconds: int
    total_sessions: int
    active_sessions: int
    average_session_time_seconds: float
    module_times: Dict[int, int]
    last_activity: Optional[datetime] = None

