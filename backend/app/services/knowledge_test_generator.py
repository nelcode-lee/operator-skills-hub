"""
AI-Powered Knowledge Test Generator
Creates knowledge tests using uploaded materials and NOCN guidance framework
"""

import json
import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import openai
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.course import CourseFileContent, Course
from ..models.learning import Assessment, AssessmentQuestion, AssessmentAttempt
from ..models.user import User


class KnowledgeTestGenerator:
    """AI-powered knowledge test generator using uploaded materials and NOCN framework"""
    
    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        self.nocn_templates_path = Path("learning-content/assessment-templates")
        self.learning_content_path = Path("learning-content")
    
    async def generate_knowledge_test(
        self,
        course_id: int,
        content_id: int,
        question_count: int = 10,
        passing_score: int = 70,
        time_limit: int = 30,
        db: Session = None
    ) -> Dict[str, Any]:
        """Generate a knowledge test using AI and uploaded materials"""
        
        try:
            # Get the course content
            content = db.query(CourseFileContent).filter(
                CourseFileContent.id == content_id,
                CourseFileContent.course_id == course_id
            ).first()
            
            if not content:
                raise ValueError("Content not found")
            
            # Get course information
            course = db.query(Course).filter(Course.id == course_id).first()
            if not course:
                raise ValueError("Course not found")
            
            # Load NOCN assessment templates
            nocn_context = self._load_nocn_templates()
            
            # Load learning content context
            learning_context = self._load_learning_content()
            
            # Generate test using AI
            test_data = await self._generate_test_with_ai(
                course=course,
                content=content,
                question_count=question_count,
                passing_score=passing_score,
                time_limit=time_limit,
                nocn_context=nocn_context,
                learning_context=learning_context
            )
            
            # For now, return the test data without saving to database
            # TODO: Implement proper database storage when assessment tables are ready
            
            return {
                "status": "success",
                "assessment_id": f"temp_{course_id}_{content_id}",
                "title": test_data["title"],
                "description": test_data["description"],
                "question_count": len(test_data["questions"]),
                "passing_score": passing_score,
                "time_limit": time_limit,
                "questions": test_data["questions"],
                "note": "Test generated successfully. Database storage will be implemented soon."
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to generate knowledge test: {str(e)}"
            }
    
    def _load_nocn_templates(self) -> str:
        """Load NOCN assessment templates for context"""
        try:
            templates = []
            if self.nocn_templates_path.exists():
                for template_file in self.nocn_templates_path.glob("*.md"):
                    with open(template_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        templates.append(f"## {template_file.stem}\n{content}")
            
            return "\n\n".join(templates)
        except Exception as e:
            print(f"Warning: Could not load NOCN templates: {e}")
            return ""
    
    def _load_learning_content(self) -> str:
        """Load learning content for context"""
        try:
            content = []
            if self.learning_content_path.exists():
                # Load content index
                index_file = self.learning_content_path / "content-index.json"
                if index_file.exists():
                    with open(index_file, 'r', encoding='utf-8') as f:
                        index_data = json.load(f)
                    
                    # Load main content files
                    for item in index_data.get("content", []):
                        if item.get("type") == "course_content":
                            file_path = self.learning_content_path / item["file"]
                            if file_path.exists():
                                with open(file_path, 'r', encoding='utf-8') as f:
                                    file_content = f.read()
                                    content.append(f"## {item['title']}\n{file_content}")
            
            return "\n\n".join(content)
        except Exception as e:
            print(f"Warning: Could not load learning content: {e}")
            return ""
    
    async def _generate_test_with_ai(
        self,
        course: Course,
        content: CourseFileContent,
        question_count: int,
        passing_score: int,
        time_limit: int,
        nocn_context: str,
        learning_context: str
    ) -> Dict[str, Any]:
        """Generate test using OpenAI with context from uploaded materials and NOCN framework"""
        
        # Create context for AI
        context_prompt = f"""
You are an expert assessment creator for construction training courses. Create a comprehensive knowledge test based on the following information:

COURSE INFORMATION:
- Title: {course.title}
- Description: {course.description}
- Category: {course.category or 'Construction Training'}

UPLOADED CONTENT:
- Title: {content.title}
- Description: {content.description}
- Content Type: {content.content_type}

NOCN ASSESSMENT FRAMEWORK:
{nocn_context}

LEARNING CONTENT CONTEXT:
{learning_context}

REQUIREMENTS:
1. Create {question_count} high-quality multiple choice questions
2. Questions should test practical knowledge and understanding
3. Use UK English spelling throughout
4. Ensure answer options are similar in length to avoid guessability
5. Place correct answers in random positions (not always top-right)
6. Include questions about:
   - Health and safety procedures
   - Technical skills and knowledge
   - Equipment operation
   - Site management
   - Environmental compliance
   - NOCN assessment requirements

QUESTION FORMAT:
Each question should have:
- Clear, unambiguous question text
- 4 answer options (A, B, C, D)
- Correct answer marked
- Brief explanation for the correct answer
- Difficulty level (beginner/intermediate/advanced)

Return the response as JSON with this structure:
{{
    "title": "Knowledge Test for [Course Title]",
    "description": "Comprehensive assessment covering key learning objectives",
    "questions": [
        {{
            "question": "Question text here?",
            "options": {{
                "A": "Option A",
                "B": "Option B", 
                "C": "Option C",
                "D": "Option D"
            }},
            "correct_answer": "A",
            "explanation": "Explanation of why this is correct",
            "difficulty": "intermediate"
        }}
    ]
}}
"""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert construction training assessment creator. Create comprehensive, fair, and educational knowledge tests."},
                    {"role": "user", "content": context_prompt}
                ],
                max_tokens=3000,
                temperature=0.7
            )
            
            # Parse AI response
            ai_response = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response
            if "```json" in ai_response:
                json_start = ai_response.find("```json") + 7
                json_end = ai_response.find("```", json_start)
                json_str = ai_response[json_start:json_end].strip()
            else:
                json_str = ai_response
            
            test_data = json.loads(json_str)
            
            # Validate and clean the data
            if "questions" not in test_data:
                raise ValueError("AI response missing questions")
            
            # Ensure we have the right number of questions
            questions = test_data["questions"][:question_count]
            
            return {
                "title": test_data.get("title", f"Knowledge Test for {course.title}"),
                "description": test_data.get("description", "Comprehensive assessment covering key learning objectives"),
                "questions": questions
            }
            
        except json.JSONDecodeError as e:
            # Fallback: create a basic test structure
            return self._create_fallback_test(course, content, question_count)
        except Exception as e:
            print(f"AI generation failed: {e}")
            return self._create_fallback_test(course, content, question_count)
    
    def _create_fallback_test(self, course: Course, content: CourseFileContent, question_count: int) -> Dict[str, Any]:
        """Create a fallback test if AI generation fails"""
        
        questions = []
        for i in range(min(question_count, 5)):  # Limit to 5 fallback questions
            questions.append({
                "question": f"Question {i+1}: What is a key safety consideration when working on construction sites?",
                "options": {
                    "A": "Wear appropriate PPE at all times",
                    "B": "Work alone to avoid distractions", 
                    "C": "Ignore safety signs if you're experienced",
                    "D": "Skip safety briefings to save time"
                },
                "correct_answer": "A",
                "explanation": "Personal Protective Equipment (PPE) is essential for construction site safety",
                "difficulty": "beginner"
            })
        
        return {
            "title": f"Knowledge Test for {course.title}",
            "description": "Basic assessment covering essential safety and technical knowledge",
            "questions": questions
        }
    
    def _save_assessment_to_db(
        self,
        db: Session,
        course_id: int,
        content_id: int,
        test_data: Dict[str, Any],
        passing_score: int,
        time_limit: int
    ) -> Assessment:
        """Save the generated assessment to the database"""
        
        # Create assessment record
        assessment = Assessment(
            course_id=course_id,
            title=test_data["title"],
            description=test_data["description"],
            passing_score=passing_score,
            time_limit_minutes=time_limit,
            total_questions=len(test_data["questions"]),
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(assessment)
        db.flush()  # Get the ID
        
        # Create question records
        for i, question_data in enumerate(test_data["questions"]):
            question = AssessmentQuestion(
                assessment_id=assessment.id,
                question_text=question_data["question"],
                question_type="multiple_choice",
                options=question_data["options"],
                correct_answer=question_data["correct_answer"],
                explanation=question_data.get("explanation", ""),
                difficulty_level=question_data.get("difficulty", "intermediate"),
                points=1,
                order_index=i + 1,
                is_active=True
            )
            db.add(question)
        
        db.commit()
        return assessment


class LearningAnalytics:
    """Learning analytics and student progress tracking"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_course_analytics(self, course_id: int) -> Dict[str, Any]:
        """Get comprehensive analytics for a course"""
        
        try:
            # Get course information
            course = self.db.query(Course).filter(Course.id == course_id).first()
            if not course:
                return {"error": "Course not found"}
            
            # Get enrollment statistics
            from ..models.learning import Enrollment
            enrollments = self.db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
            
            total_enrollments = len(enrollments)
            active_enrollments = len([e for e in enrollments if e.status == "active"])
            completed_enrollments = len([e for e in enrollments if e.status == "completed"])
            
            # Calculate average progress
            if enrollments:
                avg_progress = sum(e.progress for e in enrollments) / len(enrollments)
            else:
                avg_progress = 0
            
            # Get content statistics
            content_files = self.db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course_id,
                CourseFileContent.is_active == True
            ).all()
            
            total_content = len(content_files)
            pdf_content = len([c for c in content_files if c.content_type == "pdf"])
            
            # Simple analytics without complex assessment queries
            return {
                "course_id": course_id,
                "course_title": course.title,
                "course_description": course.description,
                "enrollments": {
                    "total": total_enrollments,
                    "active": active_enrollments,
                    "completed": completed_enrollments,
                    "completion_rate": round((completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0, 2)
                },
                "progress": {
                    "average_progress": round(avg_progress, 2),
                    "total_students": total_enrollments
                },
                "assessments": {
                    "total_assessments": 0,  # Will be updated when assessment system is fully implemented
                    "total_questions": 0,
                    "recent_attempts": 0
                },
                "content": {
                    "total_files": total_content,
                    "pdf_files": pdf_content,
                    "other_files": total_content - pdf_content
                },
                "course_info": {
                    "category": course.category or "General",
                    "duration_hours": course.duration_hours or 0,
                    "difficulty_level": course.difficulty_level or "Unknown"
                },
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {"error": f"Failed to generate analytics: {str(e)}"}
