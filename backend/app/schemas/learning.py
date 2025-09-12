"""
Pydantic schemas for learning-related models
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StudentCourseResponse(BaseModel):
    id: int
    title: str
    description: str
    category: Optional[str] = None
    duration_hours: Optional[int] = None
    difficulty_level: Optional[str] = None
    progress_percentage: float
    enrolled_at: datetime
    last_accessed: datetime
    status: str  # 'active', 'completed', 'paused'

    class Config:
        from_attributes = True


class ContentResponse(BaseModel):
    id: int
    title: str
    content_type: str  # 'pdf', 'video', 'image', 'interactive', 'test'
    description: str
    file_path: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_completed: bool
    completion_percentage: float
    last_accessed: Optional[datetime] = None
    course_id: Optional[int] = None
    course_title: Optional[str] = None

    class Config:
        from_attributes = True


class LearningSessionCreate(BaseModel):
    course_id: int
    content_id: Optional[int] = None


class LearningSessionResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    content_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    progress_percentage: Optional[float] = None

    class Config:
        from_attributes = True


class LearningProgressResponse(BaseModel):
    total_courses: int
    completed_courses: int
    overall_progress: float
    total_learning_time_minutes: int
    current_streak_days: int
    achievements_earned: int

    class Config:
        from_attributes = True


class AssessmentResponse(BaseModel):
    id: int
    title: str
    description: str
    course_id: int
    passing_score: int
    time_limit_minutes: int
    total_questions: int
    questions: List['AssessmentQuestionResponse']

    class Config:
        from_attributes = True


class AssessmentQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str  # 'multiple_choice', 'true_false', 'fill_blank'
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    points: int

    class Config:
        from_attributes = True


class AssessmentInfoResponse(BaseModel):
    id: int
    title: str
    description: str
    course_id: int
    course_title: str
    passing_score: int
    time_limit_minutes: int
    total_questions: int
    attempts_allowed: int
    attempts_used: int
    last_attempt: Optional[dict] = None

    class Config:
        from_attributes = True


class AssessmentAttemptCreate(BaseModel):
    assessment_id: int
    answers: List[dict]  # List of answer objects


class AssessmentAttemptResponse(BaseModel):
    id: int
    score: int
    total_questions: int
    percentage: float
    passed: bool
    completed_at: str
    time_taken_minutes: int

    class Config:
        from_attributes = True