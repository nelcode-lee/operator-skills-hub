"""
Knowledge Test System for Course Content Retention
Creates and manages knowledge stop tests to verify student learning
"""

import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from ..models.learning import Assessment, AssessmentAttempt
from ..models.course import CourseContent
from ..core.config import settings


class KnowledgeTestGenerator:
    """Generates knowledge tests from course content"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_test_from_content(self, content_id: int, instructor_id: int, 
                                test_type: str = "multiple_choice", 
                                question_count: int = 10) -> Dict[str, Any]:
        """Create a knowledge test from course content"""
        try:
            # Get course content
            content = self.db.query(CourseContent).filter(
                CourseContent.id == content_id,
                CourseContent.instructor_id == instructor_id
            ).first()
            
            if not content:
                return {"error": "Content not found or access denied"}
            
            # Generate questions based on content
            questions = self._generate_questions_from_text(
                content.text_content or "",
                question_count,
                test_type
            )
            
            # Create assessment record
            assessment = Assessment(
                course_id=content.course_id,
                content_id=content_id,
                instructor_id=instructor_id,
                title=f"Knowledge Test - {content.title}",
                description="Test to verify understanding of course content",
                test_type=test_type,
                questions=questions,
                passing_score=settings.default_passing_score,
                time_limit=settings.default_time_limit,
                max_attempts=3,
                is_active=True
            )
            
            self.db.add(assessment)
            self.db.commit()
            
            return {
                "assessment_id": assessment.id,
                "title": assessment.title,
                "question_count": len(questions),
                "passing_score": assessment.passing_score,
                "time_limit": assessment.time_limit,
                "questions": questions
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"Error creating test: {e}")
            return {"error": str(e)}
    
    def _generate_questions_from_text(self, text: str, count: int, 
                                    test_type: str) -> List[Dict[str, Any]]:
        """Generate questions from text content using AI or rule-based methods"""
        # For now, create sample questions
        # In production, this would use AI to generate contextual questions
        
        sample_questions = [
            {
                "question": "What is the main topic discussed in this content?",
                "type": "multiple_choice",
                "options": [
                    "Safety procedures",
                    "Equipment maintenance", 
                    "Quality control",
                    "All of the above"
                ],
                "correct_answer": 3,
                "explanation": "The content covers multiple aspects including safety, maintenance, and quality."
            },
            {
                "question": "Which of the following is NOT mentioned in the content?",
                "type": "multiple_choice",
                "options": [
                    "Personal protective equipment",
                    "Emergency procedures",
                    "Cooking recipes",
                    "Safety protocols"
                ],
                "correct_answer": 2,
                "explanation": "Cooking recipes are not relevant to industrial training content."
            },
            {
                "question": "True or False: The content emphasizes the importance of following procedures.",
                "type": "true_false",
                "correct_answer": True,
                "explanation": "Following established procedures is a key theme throughout the content."
            }
        ]
        
        # Return requested number of questions
        return sample_questions[:count]
    
    def create_adaptive_test(self, user_id: int, course_id: int, 
                           difficulty_level: str = "medium") -> Dict[str, Any]:
        """Create an adaptive test based on user's learning history"""
        try:
            # Get user's previous performance
            previous_attempts = self.db.query(AssessmentAttempt).filter(
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.course_id == course_id
            ).all()
            
            # Analyze performance to determine difficulty
            if previous_attempts:
                avg_score = sum(attempt.score for attempt in previous_attempts) / len(previous_attempts)
                if avg_score > 80:
                    difficulty_level = "hard"
                elif avg_score < 60:
                    difficulty_level = "easy"
            
            # Generate questions based on difficulty
            questions = self._generate_adaptive_questions(difficulty_level)
            
            return {
                "difficulty_level": difficulty_level,
                "questions": questions,
                "adaptive": True
            }
            
        except Exception as e:
            print(f"Error creating adaptive test: {e}")
            return {"error": str(e)}
    
    def _generate_adaptive_questions(self, difficulty: str) -> List[Dict[str, Any]]:
        """Generate questions based on difficulty level"""
        if difficulty == "easy":
            return [
                {
                    "question": "What is the first step in the safety procedure?",
                    "type": "multiple_choice",
                    "options": ["Check equipment", "Wear PPE", "Read manual", "Start work"],
                    "correct_answer": 1,
                    "points": 1
                }
            ]
        elif difficulty == "hard":
            return [
                {
                    "question": "Explain the relationship between quality control and safety procedures.",
                    "type": "essay",
                    "points": 5,
                    "max_length": 200
                }
            ]
        else:  # medium
            return [
                {
                    "question": "Which safety procedure should be followed when equipment fails?",
                    "type": "multiple_choice",
                    "options": ["Continue working", "Stop and report", "Fix it yourself", "Ignore the problem"],
                    "correct_answer": 1,
                    "points": 2
                }
            ]


class TestManager:
    """Manages test execution and scoring"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def start_test_attempt(self, user_id: int, assessment_id: int) -> Dict[str, Any]:
        """Start a new test attempt"""
        try:
            # Get assessment details
            assessment = self.db.query(Assessment).filter(
                Assessment.id == assessment_id,
                Assessment.is_active == True
            ).first()
            
            if not assessment:
                return {"error": "Assessment not found or inactive"}
            
            # Check if user has remaining attempts
            previous_attempts = self.db.query(AssessmentAttempt).filter(
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.assessment_id == assessment_id
            ).count()
            
            if previous_attempts >= assessment.max_attempts:
                return {"error": "Maximum attempts exceeded"}
            
            # Create new attempt
            attempt = AssessmentAttempt(
                user_id=user_id,
                assessment_id=assessment_id,
                course_id=assessment.course_id,
                started_at=datetime.utcnow(),
                status="in_progress"
            )
            
            self.db.add(attempt)
            self.db.commit()
            
            return {
                "attempt_id": attempt.id,
                "assessment_id": assessment_id,
                "time_limit": assessment.time_limit,
                "questions": assessment.questions,
                "started_at": attempt.started_at
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"Error starting test attempt: {e}")
            return {"error": str(e)}
    
    def submit_answer(self, attempt_id: int, question_id: int, 
                     answer: Any) -> Dict[str, Any]:
        """Submit an answer for a question"""
        try:
            # Get attempt
            attempt = self.db.query(AssessmentAttempt).filter(
                AssessmentAttempt.id == attempt_id
            ).first()
            
            if not attempt or attempt.status != "in_progress":
                return {"error": "Invalid attempt or test not in progress"}
            
            # Store answer (would need to extend model to store answers)
            # For now, just return success
            return {
                "success": True,
                "answer_submitted": True,
                "question_id": question_id
            }
            
        except Exception as e:
            print(f"Error submitting answer: {e}")
            return {"error": str(e)}
    
    def submit_test(self, attempt_id: int, answers: Dict[int, Any]) -> Dict[str, Any]:
        """Submit completed test and calculate score"""
        try:
            # Get attempt and assessment
            attempt = self.db.query(AssessmentAttempt).filter(
                AssessmentAttempt.id == attempt_id
            ).first()
            
            if not attempt:
                return {"error": "Attempt not found"}
            
            assessment = self.db.query(Assessment).filter(
                Assessment.id == attempt.assessment_id
            ).first()
            
            # Calculate score
            score = self._calculate_score(assessment.questions, answers)
            passed = score >= assessment.passing_score
            
            # Update attempt
            attempt.ended_at = datetime.utcnow()
            attempt.score = score
            attempt.passed = passed
            attempt.status = "completed"
            attempt.answers = answers
            
            self.db.commit()
            
            return {
                "attempt_id": attempt_id,
                "score": score,
                "passed": passed,
                "passing_score": assessment.passing_score,
                "time_taken": (attempt.ended_at - attempt.started_at).total_seconds(),
                "feedback": self._generate_feedback(score, passed)
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"Error submitting test: {e}")
            return {"error": str(e)}
    
    def _calculate_score(self, questions: List[Dict], answers: Dict[int, Any]) -> float:
        """Calculate test score based on answers"""
        total_points = 0
        earned_points = 0
        
        for i, question in enumerate(questions):
            points = question.get("points", 1)
            total_points += points
            
            if i in answers:
                if self._check_answer(question, answers[i]):
                    earned_points += points
        
        return (earned_points / total_points * 100) if total_points > 0 else 0
    
    def _check_answer(self, question: Dict, answer: Any) -> bool:
        """Check if answer is correct"""
        if question["type"] == "multiple_choice":
            return answer == question["correct_answer"]
        elif question["type"] == "true_false":
            return answer == question["correct_answer"]
        elif question["type"] == "essay":
            # For essays, would need AI or manual grading
            return True  # Placeholder
        return False
    
    def _generate_feedback(self, score: float, passed: bool) -> str:
        """Generate feedback based on score"""
        if passed:
            if score >= 90:
                return "Excellent work! You have a strong understanding of the material."
            elif score >= 80:
                return "Good job! You understand the material well."
            else:
                return "You passed! Consider reviewing some areas for improvement."
        else:
            return "You didn't pass this time. Please review the material and try again."
    
    def get_test_results(self, user_id: int, course_id: int = None) -> List[Dict[str, Any]]:
        """Get test results for user"""
        try:
            query = self.db.query(AssessmentAttempt).filter(
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == "completed"
            )
            
            if course_id:
                query = query.filter(AssessmentAttempt.course_id == course_id)
            
            attempts = query.all()
            
            results = []
            for attempt in attempts:
                assessment = self.db.query(Assessment).filter(
                    Assessment.id == attempt.assessment_id
                ).first()
                
                results.append({
                    "attempt_id": attempt.id,
                    "assessment_title": assessment.title if assessment else "Unknown",
                    "score": attempt.score,
                    "passed": attempt.passed,
                    "started_at": attempt.started_at,
                    "ended_at": attempt.ended_at,
                    "time_taken": (attempt.ended_at - attempt.started_at).total_seconds()
                })
            
            return results
            
        except Exception as e:
            print(f"Error getting test results: {e}")
            return []

