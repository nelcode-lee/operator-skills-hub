"""
Pydantic schemas for course management
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty_level: Optional[str] = "beginner"
    duration_hours: Optional[float] = None
    price: Optional[float] = 0.0
    status: Optional[str] = "draft"
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty_level: Optional[str] = None
    duration_hours: Optional[int] = None
    is_active: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    instructor_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CourseContentBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str = "pdf"
    is_active: bool = True


class CourseContentCreate(CourseContentBase):
    course_id: int


class CourseContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CourseContentResponse(CourseContentBase):
    id: int
    course_id: int
    instructor_id: int
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CourseFileContentResponse(BaseModel):
    id: int
    course_id: int
    instructor_id: int
    title: str
    description: Optional[str] = None
    content_type: str
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    file_metadata: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PDFUploadRequest(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = ""


class AccessGrantRequest(BaseModel):
    student_id: int
    course_id: int


class LearningSessionRequest(BaseModel):
    content_id: int
    session_type: str = "learning"


class LearningSessionResponse(BaseModel):
    session_id: str
    user_id: int
    course_id: int
    content_id: int
    session_type: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None


class KnowledgeTestRequest(BaseModel):
    content_id: int
    test_type: str = "multiple_choice"
    question_count: int = 10
    passing_score: int = 70
    time_limit: int = 30  # minutes


class QuestionOption(BaseModel):
    text: str
    is_correct: bool = False


class Question(BaseModel):
    question: str
    type: str  # multiple_choice, true_false, essay
    options: Optional[List[QuestionOption]] = None
    correct_answer: Optional[Any] = None
    points: int = 1
    explanation: Optional[str] = None


class KnowledgeTestResponse(BaseModel):
    assessment_id: int
    title: str
    description: str
    test_type: str
    questions: List[Question]
    passing_score: int
    time_limit: int
    max_attempts: int
    is_active: bool


class TestAttemptRequest(BaseModel):
    assessment_id: int


class TestAnswer(BaseModel):
    question_id: int
    answer: Any


class TestSubmissionRequest(BaseModel):
    attempt_id: int
    answers: Dict[int, Any]


class TestResultResponse(BaseModel):
    attempt_id: int
    score: float
    passed: bool
    passing_score: int
    time_taken: float
    feedback: str
    correct_answers: Optional[Dict[int, Any]] = None


class LearningAnalyticsResponse(BaseModel):
    total_learning_time: float
    session_count: int
    average_session_time: float
    sessions: List[LearningSessionResponse]
    course_progress: Optional[Dict[str, Any]] = None


class CourseAccessResponse(BaseModel):
    course_id: int
    student_id: int
    access_granted: bool
    granted_at: Optional[datetime] = None
    last_accessed: Optional[datetime] = None


class PDFViewerResponse(BaseModel):
    content_id: int
    title: str
    file_path: str
    page_count: int
    viewer_url: str
    session_id: Optional[str] = None
    responsive_config: Dict[str, Any] = Field(default_factory=dict)
