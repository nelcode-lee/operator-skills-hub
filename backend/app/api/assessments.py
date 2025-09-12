"""
Assessment and Knowledge Test API Endpoints
Handles assessment creation, taking, and results
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.course import Course, CourseFileContent
from ..models.learning import Enrollment, Assessment, AssessmentAttempt, AssessmentQuestion
from ..models.user import User
from ..schemas.learning import (
    AssessmentResponse,
    AssessmentQuestionResponse,
    AssessmentAttemptResponse,
    AssessmentInfoResponse
)

router = APIRouter()


class AssessmentAnswer(BaseModel):
    question_id: int
    answer: Any


class AssessmentSubmission(BaseModel):
    answers: List[AssessmentAnswer]


@router.get("/assessments/{assessment_id}/info", response_model=AssessmentInfoResponse)
async def get_assessment_info(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment information for test page."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found."
        )
    
    # Check if student is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == assessment.course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course."
        )
    
    # Get course information
    course = db.query(Course).filter(Course.id == assessment.course_id).first()
    
    # Get user's attempts
    attempts = db.query(AssessmentAttempt).filter(
        and_(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == current_user.id
        )
    ).order_by(desc(AssessmentAttempt.completed_at)).all()
    
    last_attempt = None
    if attempts:
        last_attempt = {
            "score": attempts[0].score,
            "percentage": attempts[0].percentage,
            "passed": attempts[0].passed,
            "completed_at": attempts[0].completed_at.isoformat()
        }
    
    return AssessmentInfoResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        course_id=assessment.course_id,
        course_title=course.title if course else "Unknown Course",
        passing_score=assessment.passing_score,
        time_limit_minutes=assessment.time_limit_minutes,
        total_questions=assessment.total_questions,
        attempts_allowed=assessment.attempts_allowed,
        attempts_used=len(attempts),
        last_attempt=last_attempt
    )


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment with questions for taking the test."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found."
        )
    
    # Check if student is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == assessment.course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course."
        )
    
    # Check attempts limit
    attempts = db.query(AssessmentAttempt).filter(
        and_(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == current_user.id
        )
    ).count()
    
    if assessment.attempts_allowed != -1 and attempts >= assessment.attempts_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Maximum attempts exceeded."
        )
    
    # Get questions
    questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment_id
    ).all()
    
    question_responses = []
    for question in questions:
        question_responses.append(AssessmentQuestionResponse(
            id=question.id,
            question_text=question.question_text,
            question_type=question.question_type,
            options=question.options,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            points=question.points
        ))
    
    return AssessmentResponse(
        id=assessment.id,
        title=assessment.title,
        description=assessment.description,
        course_id=assessment.course_id,
        passing_score=assessment.passing_score,
        time_limit_minutes=assessment.time_limit_minutes,
        total_questions=assessment.total_questions,
        questions=question_responses
    )


@router.post("/assessments/{assessment_id}/attempt", response_model=AssessmentAttemptResponse)
async def submit_assessment_attempt(
    assessment_id: int,
    submission: AssessmentSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit assessment attempt and get results."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found."
        )
    
    # Check if student is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == assessment.course_id,
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this course."
        )
    
    # Get questions and correct answers
    questions = db.query(AssessmentQuestion).filter(
        AssessmentQuestion.assessment_id == assessment_id
    ).all()
    
    # Calculate score
    total_points = 0
    earned_points = 0
    correct_answers = 0
    
    for question in questions:
        total_points += question.points
        
        # Find user's answer for this question
        user_answer = None
        for answer in submission.answers:
            if answer.question_id == question.id:
                user_answer = answer.answer
                break
        
        # Check if answer is correct
        is_correct = False
        if question.question_type == "multiple_choice":
            is_correct = user_answer == question.correct_answer
        elif question.question_type == "true_false":
            is_correct = user_answer == (question.correct_answer.lower() == "true")
        elif question.question_type == "fill_blank":
            # For fill in the blank, do case-insensitive comparison
            is_correct = str(user_answer).lower().strip() == str(question.correct_answer).lower().strip()
        
        if is_correct:
            earned_points += question.points
            correct_answers += 1
    
    # Calculate percentage
    percentage = (earned_points / total_points * 100) if total_points > 0 else 0
    passed = percentage >= assessment.passing_score
    
    # Create attempt record
    attempt = AssessmentAttempt(
        user_id=current_user.id,
        assessment_id=assessment_id,
        score=earned_points,
        total_score=total_points,
        percentage=round(percentage, 2),
        passed=passed,
        completed_at=datetime.utcnow(),
        time_taken_minutes=0  # This would be calculated from start time
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return AssessmentAttemptResponse(
        id=attempt.id,
        score=attempt.score,
        total_questions=len(questions),
        percentage=attempt.percentage,
        passed=attempt.passed,
        completed_at=attempt.completed_at.isoformat(),
        time_taken_minutes=attempt.time_taken_minutes
    )


@router.get("/assessments/{assessment_id}/attempts", response_model=List[AssessmentAttemptResponse])
async def get_assessment_attempts(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all attempts for an assessment by the current user."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    attempts = db.query(AssessmentAttempt).filter(
        and_(
            AssessmentAttempt.assessment_id == assessment_id,
            AssessmentAttempt.user_id == current_user.id
        )
    ).order_by(desc(AssessmentAttempt.completed_at)).all()
    
    return [
        AssessmentAttemptResponse(
            id=attempt.id,
            score=attempt.score,
            total_questions=attempt.total_score,
            percentage=attempt.percentage,
            passed=attempt.passed,
            completed_at=attempt.completed_at.isoformat(),
            time_taken_minutes=attempt.time_taken_minutes
        )
        for attempt in attempts
    ]


@router.get("/my-assessments", response_model=List[AssessmentInfoResponse])
async def get_my_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assessments available to the current student."""
    
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Student role required."
        )
    
    # Get enrolled courses
    enrollments = db.query(Enrollment).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.status == "active"
        )
    ).all()
    
    course_ids = [enrollment.course_id for enrollment in enrollments]
    
    # Get assessments for enrolled courses
    assessments = db.query(Assessment).filter(
        Assessment.course_id.in_(course_ids)
    ).all()
    
    assessment_responses = []
    for assessment in assessments:
        # Get course information
        course = db.query(Course).filter(Course.id == assessment.course_id).first()
        
        # Get user's attempts
        attempts = db.query(AssessmentAttempt).filter(
            and_(
                AssessmentAttempt.assessment_id == assessment.id,
                AssessmentAttempt.user_id == current_user.id
            )
        ).order_by(desc(AssessmentAttempt.completed_at)).all()
        
        last_attempt = None
        if attempts:
            last_attempt = {
                "score": attempts[0].score,
                "percentage": attempts[0].percentage,
                "passed": attempts[0].passed,
                "completed_at": attempts[0].completed_at.isoformat()
            }
        
        assessment_responses.append(AssessmentInfoResponse(
            id=assessment.id,
            title=assessment.title,
            description=assessment.description,
            course_id=assessment.course_id,
            course_title=course.title if course else "Unknown Course",
            passing_score=assessment.passing_score,
            time_limit_minutes=assessment.time_limit_minutes,
            total_questions=assessment.total_questions,
            attempts_allowed=assessment.attempts_allowed,
            attempts_used=len(attempts),
            last_attempt=last_attempt
        ))
    
    return assessment_responses
