"""
PDF Processing Service for Course Materials
Handles PDF upload, processing, and content extraction
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
import aiofiles
from fastapi import UploadFile, HTTPException
from PIL import Image
import PyPDF2
import magic
from sqlalchemy.orm import Session

from ..core.config import settings
from ..models.course import CourseFileContent, Course
from ..models.learning import LearningSession, Enrollment


class PDFProcessor:
    """Handles PDF processing and content extraction"""
    
    def __init__(self):
        self.upload_dir = Path("uploads/courses")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.allowed_types = ["application/pdf"]
    
    async def validate_pdf(self, file: UploadFile) -> bool:
        """Validate PDF file"""
        if file.size > self.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {self.max_file_size // (1024*1024)}MB"
            )
        
        # Check file type
        content = await file.read()
        file_type = magic.from_buffer(content, mime=True)
        
        if file_type not in self.allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only PDF files are allowed."
            )
        
        # Reset file pointer
        await file.seek(0)
        return True
    
    async def process_pdf(self, file: UploadFile, course_id: int, instructor_id: int) -> Dict[str, Any]:
        """Process PDF and extract content"""
        await self.validate_pdf(file)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = self.upload_dir / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Extract PDF metadata and content
        pdf_info = await self._extract_pdf_content(file_path)
        
        return {
            "file_id": file_id,
            "filename": filename,
            "file_path": str(file_path),
            "file_size": file.size,
            "page_count": pdf_info["page_count"],
            "title": pdf_info["title"],
            "author": pdf_info["author"],
            "course_id": course_id,
            "instructor_id": instructor_id,
            "status": "processed"
        }
    
    async def _extract_pdf_content(self, file_path: Path) -> Dict[str, Any]:
        """Extract content and metadata from PDF"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract metadata
                metadata = pdf_reader.metadata or {}
                
                # Extract text from all pages
                text_content = []
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        text = page.extract_text()
                        if text.strip():
                            text_content.append({
                                "page": page_num + 1,
                                "text": text.strip()
                            })
                    except Exception as e:
                        print(f"Error extracting text from page {page_num + 1}: {e}")
                
                return {
                    "page_count": len(pdf_reader.pages),
                    "title": metadata.get("Title", ""),
                    "author": metadata.get("Author", ""),
                    "subject": metadata.get("Subject", ""),
                    "creator": metadata.get("Creator", ""),
                    "text_content": text_content
                }
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error processing PDF: {str(e)}"
            )
    
    async def generate_thumbnails(self, file_path: Path, course_id: int) -> List[str]:
        """Generate thumbnails for PDF pages"""
        try:
            # This would require pdf2image library for better PDF to image conversion
            # For now, we'll create a placeholder
            thumbnails = []
            return thumbnails
        except Exception as e:
            print(f"Error generating thumbnails: {e}")
            return []
    
    async def extract_images(self, file_path: Path) -> List[Dict[str, Any]]:
        """Extract images from PDF for responsive viewing"""
        try:
            images = []
            # This would require additional libraries like pdf2image
            # For now, return empty list
            return images
        except Exception as e:
            print(f"Error extracting images: {e}")
            return []


class CourseAccessManager:
    """Manages course access permissions and student enrollment"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def grant_access(self, course_id: int, student_id: int, instructor_id: int) -> bool:
        """Grant access to a course for a student"""
        try:
            # Check if instructor owns the course
            course = self.db.query(Course).filter(
                Course.id == course_id,
                Course.instructor_id == instructor_id
            ).first()
            
            if not course:
                return False
            
            # Check if already enrolled
            existing_enrollment = self.db.query(Enrollment).filter(
                Enrollment.user_id == student_id,
                Enrollment.course_id == course_id
            ).first()
            
            if existing_enrollment:
                # Update status to active if it was inactive
                if existing_enrollment.status != "active":
                    existing_enrollment.status = "active"
                    self.db.commit()
                return True
            
            # Create enrollment record
            enrollment = Enrollment(
                user_id=student_id,
                course_id=course_id,
                status="active"
            )
            
            self.db.add(enrollment)
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            print(f"Error granting access: {e}")
            return False
    
    def revoke_access(self, course_id: int, student_id: int, instructor_id: int) -> bool:
        """Revoke access to a course for a student"""
        try:
            # Check if instructor owns the course
            course = self.db.query(Course).filter(
                Course.id == course_id,
                Course.instructor_id == instructor_id
            ).first()
            
            if not course:
                return False
            
            # Update enrollment status
            enrollment = self.db.query(Enrollment).filter(
                Enrollment.user_id == student_id,
                Enrollment.course_id == course_id
            ).first()
            
            if enrollment:
                enrollment.status = "revoked"
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error revoking access: {e}")
            return False
    
    def get_student_access(self, course_id: int, student_id: int) -> bool:
        """Check if student has access to course"""
        enrollment = self.db.query(LearningSession).filter(
            LearningSession.user_id == student_id,
            LearningSession.course_id == course_id,
            LearningSession.session_type == "enrollment",
            LearningSession.status == "active"
        ).first()
        
        return enrollment is not None
    
    def get_course_students(self, course_id: int, instructor_id: int) -> List[Dict[str, Any]]:
        """Get list of students with access to course"""
        try:
            # Verify instructor owns the course
            course = self.db.query(Course).filter(
                Course.id == course_id,
                Course.instructor_id == instructor_id
            ).first()
            
            if not course:
                return []
            
            # Get enrolled students
            enrollments = self.db.query(LearningSession).filter(
                LearningSession.course_id == course_id,
                LearningSession.session_type == "enrollment",
                LearningSession.status == "active"
            ).all()
            
            students = []
            for enrollment in enrollments:
                # Get user details (would need to join with users table)
                students.append({
                    "student_id": enrollment.user_id,
                    "enrolled_at": enrollment.created_at,
                    "last_accessed": enrollment.updated_at
                })
            
            return students
            
        except Exception as e:
            print(f"Error getting course students: {e}")
            return []


class LearningTimeTracker:
    """Tracks student learning time and progress"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def start_session(self, user_id: int, course_id: int, content_id: int) -> str:
        """Start a learning session"""
        try:
            session = LearningSession(
                user_id=user_id,
                course_id=course_id,
                content_id=content_id,
                session_type="learning",
                status="active",
                start_time=datetime.utcnow()
            )
            
            self.db.add(session)
            self.db.commit()
            
            return str(session.id)
            
        except Exception as e:
            self.db.rollback()
            print(f"Error starting session: {e}")
            return None
    
    def end_session(self, session_id: str) -> Dict[str, Any]:
        """End a learning session and calculate duration"""
        try:
            session = self.db.query(LearningSession).filter(
                LearningSession.id == session_id
            ).first()
            
            if not session:
                return None
            
            session.status = "completed"
            session.end_time = datetime.utcnow()
            session.duration = (session.end_time - session.start_time).total_seconds()
            
            self.db.commit()
            
            return {
                "session_id": session_id,
                "duration": session.duration,
                "start_time": session.start_time,
                "end_time": session.end_time
            }
            
        except Exception as e:
            self.db.rollback()
            print(f"Error ending session: {e}")
            return None
    
    def get_learning_analytics(self, user_id: int, course_id: int = None) -> Dict[str, Any]:
        """Get learning analytics for user"""
        try:
            query = self.db.query(LearningSession).filter(
                LearningSession.user_id == user_id,
                LearningSession.session_type == "learning",
                LearningSession.status == "completed"
            )
            
            if course_id:
                query = query.filter(LearningSession.course_id == course_id)
            
            sessions = query.all()
            
            total_time = sum(session.duration for session in sessions if session.duration)
            session_count = len(sessions)
            avg_session_time = total_time / session_count if session_count > 0 else 0
            
            return {
                "total_learning_time": total_time,
                "session_count": session_count,
                "average_session_time": avg_session_time,
                "sessions": [
                    {
                        "session_id": str(session.id),
                        "course_id": session.course_id,
                        "duration": session.duration,
                        "start_time": session.start_time,
                        "end_time": session.end_time
                    }
                    for session in sessions
                ]
            }
            
        except Exception as e:
            print(f"Error getting learning analytics: {e}")
            return {}


