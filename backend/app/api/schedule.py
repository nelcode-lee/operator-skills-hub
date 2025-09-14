"""
Schedule API endpoints for managing course events and activities
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ..core.database import get_db
from ..models.course import Course
from ..models.user import User
from ..api.auth import get_current_user

router = APIRouter()

class ScheduleEventCreate(BaseModel):
    title: str
    course_id: int
    start_date: date
    end_date: date
    start_time: str
    end_time: str
    location: str
    instructor_id: int
    max_participants: int
    event_type: str
    description: str

class ScheduleEventResponse(BaseModel):
    id: int
    title: str
    course_id: int
    course_title: str
    start_date: date
    end_date: date
    start_time: str
    end_time: str
    location: str
    instructor: str
    max_participants: int
    current_participants: int
    event_type: str
    status: str
    description: str
    color: str

    class Config:
        from_attributes = True

@router.get("/events", response_model=List[ScheduleEventResponse])
async def get_schedule_events(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    event_type: Optional[str] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get schedule events with optional filtering"""
    
    # Comprehensive seed data for construction training calendar (2025 dates)
    # TODO: Implement actual database queries when schedule events table is created
    
    sample_events = [
        # September 2025 Events
        {
            "id": 1,
            "title": "Excavator Safety Training - Module 1",
            "course_id": 1,
            "course_title": "Plant Operations Level 2",
            "start_date": date(2025, 9, 8),
            "end_date": date(2025, 9, 8),
            "start_time": "09:00",
            "end_time": "17:00",
            "location": "Training Center A",
            "instructor": "John Smith",
            "max_participants": 12,
            "current_participants": 10,
            "event_type": "class",
            "status": "completed",
            "description": "Introduction to excavator safety procedures and pre-operation checks",
            "color": "bg-blue-500"
        },
        {
            "id": 2,
            "title": "GPS Machine Control Theory",
            "course_id": 2,
            "course_title": "GPS Training Course",
            "start_date": date(2025, 9, 10),
            "end_date": date(2025, 9, 10),
            "start_time": "09:00",
            "end_time": "12:00",
            "location": "Computer Lab",
            "instructor": "Sarah Johnson",
            "max_participants": 20,
            "current_participants": 18,
            "event_type": "class",
            "status": "completed",
            "description": "Fundamentals of GPS machine control systems and applications",
            "color": "bg-blue-500"
        },
        {
            "id": 3,
            "title": "Load Chart Interpretation Workshop",
            "course_id": 1,
            "course_title": "Plant Operations Level 2",
            "start_date": date(2025, 9, 12),
            "end_date": date(2025, 9, 12),
            "start_time": "14:00",
            "end_time": "17:00",
            "location": "Workshop B",
            "instructor": "Mike Wilson",
            "max_participants": 8,
            "current_participants": 8,
            "event_type": "practical",
            "status": "completed",
            "description": "Hands-on workshop for load chart reading and stability calculations",
            "color": "bg-green-500"
        },
        {
            "id": 4,
            "title": "NRSWA Registration Deadline",
            "course_id": 3,
            "course_title": "NRSWA Training",
            "start_date": date(2025, 9, 15),
            "end_date": date(2025, 9, 15),
            "start_time": "23:59",
            "end_time": "23:59",
            "location": "Online",
            "instructor": "System",
            "max_participants": 50,
            "current_participants": 45,
            "event_type": "deadline",
            "status": "completed",
            "description": "Final deadline for NRSWA Training course registration",
            "color": "bg-orange-500"
        },
        {
            "id": 5,
            "title": "Instructor Monthly Meeting",
            "course_id": 0,
            "course_title": "Staff Meeting",
            "start_date": date(2025, 9, 16),
            "end_date": date(2025, 9, 16),
            "start_time": "10:00",
            "end_time": "11:30",
            "location": "Conference Room",
            "instructor": "Training Manager",
            "max_participants": 15,
            "current_participants": 15,
            "event_type": "meeting",
            "status": "completed",
            "description": "Monthly instructor coordination and training updates",
            "color": "bg-purple-500"
        },
        {
            "id": 6,
            "title": "Excavator Practical Assessment",
            "course_id": 1,
            "course_title": "Plant Operations Level 2",
            "start_date": date(2025, 9, 18),
            "end_date": date(2025, 9, 18),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Training Yard",
            "instructor": "John Smith",
            "max_participants": 8,
            "current_participants": 6,
            "event_type": "practical",
            "status": "scheduled",
            "description": "Practical assessment of excavator operation skills",
            "color": "bg-green-500"
        },
        {
            "id": 7,
            "title": "GPS Machine Control Exam",
            "course_id": 2,
            "course_title": "GPS Training Course",
            "start_date": date(2025, 9, 22),
            "end_date": date(2025, 9, 22),
            "start_time": "10:00",
            "end_time": "12:00",
            "location": "Computer Lab",
            "instructor": "Sarah Johnson",
            "max_participants": 20,
            "current_participants": 18,
            "event_type": "exam",
            "status": "scheduled",
            "description": "Written examination on GPS machine control systems",
            "color": "bg-red-500"
        },
        {
            "id": 8,
            "title": "Site Safety Plus Course",
            "course_id": 4,
            "course_title": "Site Safety Plus",
            "start_date": date(2025, 9, 24),
            "end_date": date(2025, 9, 26),
            "start_time": "09:00",
            "end_time": "17:00",
            "location": "Training Center B",
            "instructor": "David Brown",
            "max_participants": 25,
            "current_participants": 22,
            "event_type": "class",
            "status": "scheduled",
            "description": "3-day CITB accredited Site Safety Plus course",
            "color": "bg-blue-500"
        },
        {
            "id": 9,
            "title": "Utility Detection Training",
            "course_id": 5,
            "course_title": "Utility Detection & Mapping",
            "start_date": date(2025, 9, 29),
            "end_date": date(2025, 9, 29),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Detection Facility",
            "instructor": "Emma Davis",
            "max_participants": 12,
            "current_participants": 10,
            "event_type": "practical",
            "status": "scheduled",
            "description": "Hands-on utility detection and mapping training",
            "color": "bg-green-500"
        },
        {
            "id": 10,
            "title": "Course Evaluation Deadline",
            "course_id": 1,
            "course_title": "Plant Operations Level 2",
            "start_date": date(2025, 9, 30),
            "end_date": date(2025, 9, 30),
            "start_time": "23:59",
            "end_time": "23:59",
            "location": "Online",
            "instructor": "System",
            "max_participants": 12,
            "current_participants": 10,
            "event_type": "deadline",
            "status": "scheduled",
            "description": "Deadline for course evaluation and feedback submission",
            "color": "bg-orange-500"
        },

        # October 2025 Events
        {
            "id": 11,
            "title": "Roller Operations Training",
            "course_id": 6,
            "course_title": "Compaction Equipment Operations",
            "start_date": date(2025, 10, 5),
            "end_date": date(2025, 10, 5),
            "start_time": "09:00",
            "end_time": "17:00",
            "location": "Training Yard",
            "instructor": "James Wilson",
            "max_participants": 10,
            "current_participants": 8,
            "event_type": "class",
            "status": "scheduled",
            "description": "Comprehensive roller operation and compaction techniques",
            "color": "bg-blue-500"
        },
        {
            "id": 12,
            "title": "Telehandler Safety Assessment",
            "course_id": 7,
            "course_title": "Telehandler Operations",
            "start_date": date(2025, 10, 8),
            "end_date": date(2025, 10, 8),
            "start_time": "14:00",
            "end_time": "17:00",
            "location": "Workshop A",
            "instructor": "Lisa Anderson",
            "max_participants": 8,
            "current_participants": 6,
            "event_type": "practical",
            "status": "scheduled",
            "description": "Practical assessment of telehandler safety procedures",
            "color": "bg-green-500"
        },
        {
            "id": 13,
            "title": "Plant Apprenticeship Induction",
            "course_id": 8,
            "course_title": "Plant Operative Apprenticeship",
            "start_date": date(2025, 10, 12),
            "end_date": date(2025, 10, 12),
            "start_time": "10:00",
            "end_time": "15:00",
            "location": "Main Hall",
            "instructor": "Training Manager",
            "max_participants": 30,
            "current_participants": 25,
            "event_type": "meeting",
            "status": "scheduled",
            "description": "Induction session for new plant operative apprentices",
            "color": "bg-purple-500"
        },
        {
            "id": 14,
            "title": "Dumper Truck Operations Exam",
            "course_id": 9,
            "course_title": "Dumper Operations",
            "start_date": date(2025, 10, 15),
            "end_date": date(2025, 10, 15),
            "start_time": "10:00",
            "end_time": "12:00",
            "location": "Computer Lab",
            "instructor": "Tom Roberts",
            "max_participants": 15,
            "current_participants": 12,
            "event_type": "exam",
            "status": "scheduled",
            "description": "Written examination on dumper truck operations and safety",
            "color": "bg-red-500"
        },
        {
            "id": 15,
            "title": "Skills Bootcamp Launch",
            "course_id": 10,
            "course_title": "Digital Construction Skills",
            "start_date": date(2025, 10, 19),
            "end_date": date(2025, 10, 19),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Innovation Lab",
            "instructor": "Alex Chen",
            "max_participants": 20,
            "current_participants": 18,
            "event_type": "class",
            "status": "scheduled",
            "description": "Launch of digital construction skills bootcamp program",
            "color": "bg-blue-500"
        },
        {
            "id": 16,
            "title": "Health & Safety Refresher",
            "course_id": 11,
            "course_title": "H&S Short Courses",
            "start_date": date(2025, 10, 22),
            "end_date": date(2025, 10, 22),
            "start_time": "09:00",
            "end_time": "12:00",
            "location": "Training Center A",
            "instructor": "Maria Garcia",
            "max_participants": 25,
            "current_participants": 20,
            "event_type": "class",
            "status": "scheduled",
            "description": "Health and safety refresher course for construction workers",
            "color": "bg-blue-500"
        },
        {
            "id": 17,
            "title": "Equipment Maintenance Workshop",
            "course_id": 12,
            "course_title": "Plant Maintenance",
            "start_date": date(2025, 10, 26),
            "end_date": date(2025, 10, 26),
            "start_time": "14:00",
            "end_time": "17:00",
            "location": "Maintenance Bay",
            "instructor": "Steve Taylor",
            "max_participants": 12,
            "current_participants": 10,
            "event_type": "practical",
            "status": "scheduled",
            "description": "Hands-on workshop for basic plant equipment maintenance",
            "color": "bg-green-500"
        },
        {
            "id": 18,
            "title": "Course Completion Deadline",
            "course_id": 2,
            "course_title": "GPS Training Course",
            "start_date": date(2025, 10, 28),
            "end_date": date(2025, 10, 28),
            "start_time": "23:59",
            "end_time": "23:59",
            "location": "Online",
            "instructor": "System",
            "max_participants": 20,
            "current_participants": 18,
            "event_type": "deadline",
            "status": "scheduled",
            "description": "Final deadline for GPS Training Course completion",
            "color": "bg-orange-500"
        },

        # November 2025 Events
        {
            "id": 19,
            "title": "Dozer Operations Training",
            "course_id": 13,
            "course_title": "Earthmoving Equipment",
            "start_date": date(2025, 11, 4),
            "end_date": date(2025, 11, 4),
            "start_time": "09:00",
            "end_time": "17:00",
            "location": "Training Yard",
            "instructor": "Mark Thompson",
            "max_participants": 8,
            "current_participants": 6,
            "event_type": "class",
            "status": "scheduled",
            "description": "Comprehensive dozer operation and earthmoving techniques",
            "color": "bg-blue-500"
        },
        {
            "id": 20,
            "title": "NOCN Assessment Day",
            "course_id": 14,
            "course_title": "NOCN Accredited Courses",
            "start_date": date(2025, 11, 7),
            "end_date": date(2025, 11, 7),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Assessment Center",
            "instructor": "NOCN Assessor",
            "max_participants": 15,
            "current_participants": 12,
            "event_type": "exam",
            "status": "scheduled",
            "description": "NOCN accredited assessment for construction competencies",
            "color": "bg-red-500"
        },
        {
            "id": 21,
            "title": "Instructor Development Workshop",
            "course_id": 0,
            "course_title": "Staff Development",
            "start_date": date(2025, 11, 11),
            "end_date": date(2025, 11, 11),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Conference Room",
            "instructor": "External Trainer",
            "max_participants": 20,
            "current_participants": 18,
            "event_type": "meeting",
            "status": "scheduled",
            "description": "Professional development workshop for instructors",
            "color": "bg-purple-500"
        },
        {
            "id": 22,
            "title": "Wheeled Loading Shovel Practical",
            "course_id": 15,
            "course_title": "Loading Operations",
            "start_date": date(2025, 11, 14),
            "end_date": date(2025, 11, 14),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Loading Bay",
            "instructor": "Paul Mitchell",
            "max_participants": 10,
            "current_participants": 8,
            "event_type": "practical",
            "status": "scheduled",
            "description": "Practical training for wheeled loading shovel operations",
            "color": "bg-green-500"
        },
        {
            "id": 23,
            "title": "CPCS Renewal Course",
            "course_id": 16,
            "course_title": "CPCS Renewal",
            "start_date": date(2025, 11, 18),
            "end_date": date(2025, 11, 20),
            "start_time": "09:00",
            "end_time": "17:00",
            "location": "Training Center B",
            "instructor": "CPCS Assessor",
            "max_participants": 12,
            "current_participants": 10,
            "event_type": "class",
            "status": "scheduled",
            "description": "3-day CPCS renewal course for existing card holders",
            "color": "bg-blue-500"
        },
        {
            "id": 24,
            "title": "Site Right Certification",
            "course_id": 17,
            "course_title": "Site Right Training",
            "start_date": date(2025, 11, 25),
            "end_date": date(2025, 11, 25),
            "start_time": "09:00",
            "end_time": "16:00",
            "location": "Training Center A",
            "instructor": "Site Right Assessor",
            "max_participants": 20,
            "current_participants": 18,
            "event_type": "class",
            "status": "scheduled",
            "description": "Site Right certification for construction site access",
            "color": "bg-blue-500"
        },
        {
            "id": 25,
            "title": "Quarterly Review Meeting",
            "course_id": 0,
            "course_title": "Management Meeting",
            "start_date": date(2025, 11, 28),
            "end_date": date(2025, 11, 28),
            "start_time": "14:00",
            "end_time": "16:00",
            "location": "Boardroom",
            "instructor": "Training Director",
            "max_participants": 12,
            "current_participants": 12,
            "event_type": "meeting",
            "status": "scheduled",
            "description": "Quarterly review of training programs and performance",
            "color": "bg-purple-500"
        }
    ]
    
    # Apply filters
    filtered_events = sample_events
    
    if start_date:
        filtered_events = [e for e in filtered_events if e["start_date"] >= start_date]
    
    if end_date:
        filtered_events = [e for e in filtered_events if e["start_date"] <= end_date]
    
    if event_type:
        filtered_events = [e for e in filtered_events if e["event_type"] == event_type]
    
    if course_id:
        filtered_events = [e for e in filtered_events if e["course_id"] == course_id]
    
    return filtered_events

@router.post("/events", response_model=ScheduleEventResponse)
async def create_schedule_event(
    event: ScheduleEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new schedule event"""
    
    # TODO: Implement actual event creation when schedule events table is created
    # For now, return a mock response
    
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create events"
        )
    
    # Mock response
    return {
        "id": 999,
        "title": event.title,
        "course_id": event.course_id,
        "course_title": "Sample Course",
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,
        "instructor": "Current User",
        "max_participants": event.max_participants,
        "current_participants": 0,
        "event_type": event.event_type,
        "status": "scheduled",
        "description": event.description,
        "color": "bg-blue-500"
    }

@router.get("/events/{event_id}", response_model=ScheduleEventResponse)
async def get_schedule_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific schedule event by ID"""
    
    # TODO: Implement actual database query when schedule events table is created
    # For now, return a mock response
    
    return {
        "id": event_id,
        "title": "Sample Event",
        "course_id": 1,
        "course_title": "Sample Course",
        "start_date": date.today(),
        "end_date": date.today(),
        "start_time": "09:00",
        "end_time": "17:00",
        "location": "Training Center",
        "instructor": "Sample Instructor",
        "max_participants": 20,
        "current_participants": 10,
        "event_type": "class",
        "status": "scheduled",
        "description": "Sample event description",
        "color": "bg-blue-500"
    }

@router.put("/events/{event_id}", response_model=ScheduleEventResponse)
async def update_schedule_event(
    event_id: int,
    event: ScheduleEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a schedule event"""
    
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update events"
        )
    
    # TODO: Implement actual event update when schedule events table is created
    # For now, return a mock response
    
    return {
        "id": event_id,
        "title": event.title,
        "course_id": event.course_id,
        "course_title": "Updated Course",
        "start_date": event.start_date,
        "end_date": event.end_date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "location": event.location,
        "instructor": "Updated Instructor",
        "max_participants": event.max_participants,
        "current_participants": 5,
        "event_type": event.event_type,
        "status": "scheduled",
        "description": event.description,
        "color": "bg-blue-500"
    }

@router.delete("/events/{event_id}")
async def delete_schedule_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a schedule event"""
    
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete events"
        )
    
    # TODO: Implement actual event deletion when schedule events table is created
    
    return {"message": "Event deleted successfully"}

@router.get("/calendar/{year}/{month}")
async def get_calendar_events(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get events for a specific month"""
    
    # TODO: Implement actual calendar query when schedule events table is created
    # For now, return sample data for the requested month
    
    return {
        "year": year,
        "month": month,
        "events": []
    }
