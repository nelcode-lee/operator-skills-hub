"""
Course Management API Endpoints
Handles PDF upload, access control, and course management
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User, UserProfile
from ..models.course import Course, CourseFileContent
from ..models.learning import Enrollment
from ..services.pdf_processor import PDFProcessor, CourseAccessManager, LearningTimeTracker
from ..services.ai_content_generator import AIContentGenerator
from ..services.knowledge_test_generator import KnowledgeTestGenerator, LearningAnalytics
from ..models.course import CourseModule, CourseContent
from ..schemas.course import CourseCreate, CourseResponse, CourseFileContentResponse, AccessGrantRequest
from pydantic import BaseModel
from ..schemas.learning import LearningSessionResponse

router = APIRouter(tags=["Course Management"])


class ContentTweakRequest(BaseModel):
    content_type: str  # learning_material, lesson_plan, test
    title: str
    description: str
    additional_instructions: str = ""


@router.post("/upload-pdf")
async def upload_pdf_course(
    course_id: int = Form(...),
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload PDF course material"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Simple file upload without complex processing
        import os
        import uuid
        from pathlib import Path
        
        # Create upload directory
        upload_dir = Path("uploads/courses")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = upload_dir / filename
        
        # Save file
        with open(file_path, "wb") as f:
            file_content = await file.read()
            f.write(file_content)
        
        # Create course content record
        content = CourseFileContent(
            course_id=course_id,
            instructor_id=current_user.id,
            title=title,
            description=description,
            content_type="pdf",
            file_path=str(file_path),
            file_size=len(file_content),
            page_count=1,  # Placeholder
            file_metadata={
                "original_filename": file.filename,
                "file_id": file_id
            },
            is_active=True
        )
        
        db.add(content)
        db.commit()
        db.refresh(content)
        
        return {
            "content_id": content.id,
            "title": content.title,
            "file_path": content.file_path,
            "page_count": content.page_count,
            "status": "uploaded_successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/content")
async def get_course_content(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course content for viewing"""
    try:
        # Check if user has access
        access_manager = CourseAccessManager(db)
        
        if current_user.role == "instructor":
            # Instructors can see all content they created
            content = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course_id,
                CourseFileContent.instructor_id == current_user.id
            ).all()
        else:
            # Students can only see content they have access to
            if not access_manager.get_student_access(course_id, current_user.id):
                raise HTTPException(status_code=403, detail="Access denied")
            
            content = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course_id,
                CourseFileContent.is_active == True
            ).all()
        
        return [
            {
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "content_type": item.content_type,
                "page_count": item.page_count,
                "file_size": item.file_size,
                "created_at": item.created_at,
                "file_metadata": item.file_metadata
            }
            for item in content
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/content/{content_id}/view")
async def view_course_content(
    course_id: int,
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View course content (PDF)"""
    try:
        # Check access
        access_manager = CourseAccessManager(db)
        
        if current_user.role == "instructor":
            content = db.query(CourseFileContent).filter(
                CourseFileContent.id == content_id,
                CourseFileContent.course_id == course_id,
                CourseFileContent.instructor_id == current_user.id
            ).first()
        else:
            if not access_manager.get_student_access(course_id, current_user.id):
                raise HTTPException(status_code=403, detail="Access denied")
            
            content = db.query(CourseFileContent).filter(
                CourseFileContent.id == content_id,
                CourseFileContent.course_id == course_id,
                CourseFileContent.is_active == True
            ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Start learning session for students
        if current_user.role == "student":
            tracker = LearningTimeTracker(db)
            session_id = tracker.start_session(current_user.id, course_id, content_id)
            
            return {
                "content_id": content_id,
                "title": content.title,
                "file_path": content.file_path,
                "page_count": content.page_count,
                "session_id": session_id,
                "viewer_url": f"/api/courses/{course_id}/content/{content_id}/pdf-viewer"
            }
        
        return {
            "content_id": content_id,
            "title": content.title,
            "file_path": content.file_path,
            "page_count": content.page_count,
            "viewer_url": f"/api/courses/{course_id}/content/{content_id}/pdf-viewer"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/content/{content_id}/pdf-viewer")
async def pdf_viewer(
    course_id: int,
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serve PDF viewer page"""
    try:
        # Check access
        access_manager = CourseAccessManager(db)
        
        if current_user.role == "student":
            if not access_manager.get_student_access(course_id, current_user.id):
                raise HTTPException(status_code=403, detail="Access denied")
        
        content = db.query(CourseFileContent).filter(
            CourseFileContent.id == content_id,
            CourseFileContent.course_id == course_id
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Return PDF file
        return FileResponse(
            content.file_path,
            media_type="application/pdf",
            filename=content.title + ".pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/grant-access")
async def grant_student_access(
    course_id: int,
    request: AccessGrantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grant access to course for student (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        access_manager = CourseAccessManager(db)
        success = access_manager.grant_access(course_id, request.student_id, current_user.id)
        
        if success:
            return {"message": "Access granted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to grant access")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/revoke-access")
async def revoke_student_access(
    course_id: int,
    request: AccessGrantRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke access to course for student (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        access_manager = CourseAccessManager(db)
        success = access_manager.revoke_access(course_id, request.student_id, current_user.id)
        
        if success:
            return {"message": "Access revoked successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to revoke access")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/students")
async def get_course_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of students with access to course (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Verify instructor owns the course
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found or access denied")
        
        # Get enrolled students for this course
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).all()
        
        student_list = []
        for enrollment in enrollments:
            student = db.query(User).filter(User.id == enrollment.user_id).first()
            if student:
                # Get user profile for name
                profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
                first_name = profile.first_name if profile else "Unknown"
                last_name = profile.last_name if profile else "User"
                
                student_list.append({
                    "id": student.id,
                    "email": student.email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "cscs_card_number": student.cscs_card_number,
                    "is_active": student.is_active,
                    "enrolled_at": enrollment.enrolled_at,
                    "progress": enrollment.progress
                })
        
        return {"students": student_list}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/available-students")
async def get_available_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of students available to be assigned to course (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Verify instructor owns the course
        course = db.query(Course).filter(
            Course.id == course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found or access denied")
        
        # Get all students
        all_students = db.query(User).filter(User.role == "student").all()
        
        # Get enrolled student IDs for this course
        enrolled_student_ids = db.query(Enrollment.user_id).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "active"
        ).all()
        enrolled_ids = [row[0] for row in enrolled_student_ids]
        
        # Filter out already enrolled students
        available_students = [student for student in all_students if student.id not in enrolled_ids]
        
        student_list = []
        for student in available_students:
            # Get user profile for name
            profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
            first_name = profile.first_name if profile else "Unknown"
            last_name = profile.last_name if profile else "User"
            
            student_list.append({
                "id": student.id,
                "email": student.email,
                "first_name": first_name,
                "last_name": last_name,
                "cscs_card_number": student.cscs_card_number,
                "is_active": student.is_active
            })
        
        return {"students": student_list}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/content/{content_id}/end-session")
async def end_learning_session(
    course_id: int,
    content_id: int,
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End learning session and record time"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    try:
        tracker = LearningTimeTracker(db)
        result = tracker.end_session(session_id)
        
        if result:
            return {
                "message": "Session ended successfully",
                "duration": result["duration"],
                "session_id": session_id
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to end session")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/learning-analytics")
async def get_learning_analytics(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive learning analytics for course (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        analytics = LearningAnalytics(db)
        result = analytics.get_course_analytics(course_id)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a course (instructor/admin only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        # Get the course
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check if user owns the course (or is admin)
        if current_user.role != "admin" and course.instructor_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only delete your own courses")

        # Delete related content files
        content_files = db.query(CourseFileContent).filter(CourseFileContent.course_id == course_id).all()
        for content in content_files:
            db.delete(content)

        # Delete related enrollments
        enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
        for enrollment in enrollments:
            db.delete(enrollment)

        # Delete the course
        db.delete(course)
        db.commit()

        return {"message": f"Course '{course.title}' deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/content/{content_id}/create-test")
async def create_knowledge_test(
    course_id: int,
    content_id: int,
    question_count: int = 10,
    passing_score: int = 70,
    time_limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create AI-powered knowledge test from uploaded content (instructor only)"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        generator = KnowledgeTestGenerator()
        result = await generator.generate_knowledge_test(
            course_id=course_id,
            content_id=content_id,
            question_count=question_count,
            passing_score=passing_score,
            time_limit=time_limit,
            db=db
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/tests/{assessment_id}/start")
async def start_knowledge_test(
    course_id: int,
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a knowledge test"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    try:
        manager = TestManager(db)
        result = manager.start_test_attempt(current_user.id, assessment_id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/tests/{assessment_id}/submit")
async def submit_knowledge_test(
    course_id: int,
    assessment_id: int,
    answers: Dict[int, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit knowledge test answers"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Students only")
    
    try:
        manager = TestManager(db)
        result = manager.submit_test(assessment_id, answers)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/test-results")
async def get_test_results(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get test results for user"""
    try:
        manager = TestManager(db)
        results = manager.get_test_results(current_user.id, course_id)
        
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/content/{content_id}/tweak")
async def tweak_course_content(
    course_id: int,
    content_id: int,
    request: ContentTweakRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tweak uploaded content to generate learning materials, lesson plans, or tests"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Get the original content
        original_content = db.query(CourseFileContent).filter(
            CourseFileContent.id == content_id,
            CourseFileContent.course_id == course_id,
            CourseFileContent.instructor_id == current_user.id
        ).first()
        
        if not original_content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Generate content using AI
        ai_generator = AIContentGenerator()
        
        # Process the original content for AI generation
        original_text = ai_generator.process_content_for_ai(original_content)
        
        # Generate new content based on the tweak request
        if request.content_type == "learning_material":
            ai_result = ai_generator.generate_learning_material(
                original_text, 
                request.title, 
                request.description,
                request.additional_instructions
            )
        elif request.content_type == "lesson_plan":
            ai_result = ai_generator.generate_lesson_plan(
                original_text, 
                request.title, 
                request.description,
                request.additional_instructions
            )
        elif request.content_type == "test":
            ai_result = ai_generator.generate_knowledge_test(
                original_text, 
                request.title, 
                request.description,
                request.additional_instructions
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid content type")
        
        # Create new content entry
        new_content = CourseFileContent(
            course_id=course_id,
            instructor_id=current_user.id,
            title=request.title,
            description=request.description,
            content_type=request.content_type,
            file_path=original_content.file_path,  # Reference original file
            file_size=original_content.file_size,
            page_count=original_content.page_count,
            file_metadata={
                **(original_content.file_metadata or {}),
                "tweaked_from": content_id,
                "tweak_type": request.content_type,
                "additional_instructions": request.additional_instructions,
                "generated_at": datetime.now().isoformat(),
                "ai_generated_content": ai_result.get("content", ""),
                "ai_model": ai_result.get("ai_model", "unknown"),
                "generation_status": ai_result.get("status", "unknown")
            },
            is_active=True
        )
        
        db.add(new_content)
        db.commit()
        db.refresh(new_content)
        
        return {
            "content_id": new_content.id,
            "title": new_content.title,
            "content_type": new_content.content_type,
            "status": "generated_successfully",
            "message": f"{request.content_type.replace('_', ' ')} created from {original_content.title}",
            "ai_generated_content": ai_result.get("content", ""),
            "ai_model": ai_result.get("ai_model", "unknown")
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/content/{content_id}/generated-content")
async def get_generated_content(
    course_id: int,
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated content for a specific content item"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        content = db.query(CourseFileContent).filter(
            CourseFileContent.id == content_id,
            CourseFileContent.course_id == course_id,
            CourseFileContent.instructor_id == current_user.id
        ).first()
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Extract AI-generated content from metadata
        ai_content = content.file_metadata.get("ai_generated_content", "") if content.file_metadata else ""
        
        return {
            "content_id": content.id,
            "title": content.title,
            "content_type": content.content_type,
            "generated_content": ai_content,
            "ai_model": content.file_metadata.get("ai_model", "unknown") if content.file_metadata else "unknown",
            "generated_at": content.file_metadata.get("generated_at", "") if content.file_metadata else "",
            "tweaked_from": content.file_metadata.get("tweaked_from", "") if content.file_metadata else ""
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/modules")
async def get_course_modules(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all learning modules for a course"""
    try:
        # Check if course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Authorization check: Students must be enrolled, instructors must own the course, admins can access all
        if current_user.role == "student":
            # Check if student is enrolled in the course
            enrollment = db.query(Enrollment).filter(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == "active"
            ).first()
            
            if not enrollment:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. You are not enrolled in this course. Please contact your instructor or admin to be granted access."
                )
        elif current_user.role == "instructor":
            # Instructors can only access their own courses
            if course.instructor_id != current_user.id:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. You can only access your own courses."
                )
        elif current_user.role != "admin":
            # Only students, instructors, and admins can access course modules
            raise HTTPException(
                status_code=403, 
                detail="Access denied. Insufficient permissions."
            )

        # Get modules with content
        modules = db.query(CourseModule).filter(
            CourseModule.course_id == course_id
        ).order_by(CourseModule.order).all()

        result = []
        for module in modules:
            # Get content for this module
            content = db.query(CourseContent).filter(
                CourseContent.module_id == module.id
            ).order_by(CourseContent.order).all()

            module_data = {
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "order": module.order,
                "content_type": module.content_type,
                "estimated_duration_minutes": module.estimated_duration_minutes,
                "is_required": module.is_required,
                "content": [
                    {
                        "id": c.id,
                        "title": c.title,
                        "content": c.content,
                        "content_type": c.content_type,
                        "order": c.order,
                        "media_urls": c.media_urls
                    }
                    for c in content
                ]
            }
            result.append(module_data)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/modules/{module_id}")
async def get_module_content(
    course_id: int,
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific module content"""
    try:
        # Check if course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Authorization check: Students must be enrolled, instructors must own the course, admins can access all
        if current_user.role == "student":
            # Check if student is enrolled in the course
            enrollment = db.query(Enrollment).filter(
                Enrollment.user_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == "active"
            ).first()
            
            if not enrollment:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. You are not enrolled in this course. Please contact your instructor or admin to be granted access."
                )
        elif current_user.role == "instructor":
            # Instructors can only access their own courses
            if course.instructor_id != current_user.id:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. You can only access your own courses."
                )
        elif current_user.role != "admin":
            # Only students, instructors, and admins can access course modules
            raise HTTPException(
                status_code=403, 
                detail="Access denied. Insufficient permissions."
            )

        # Get module
        module = db.query(CourseModule).filter(
            CourseModule.id == module_id,
            CourseModule.course_id == course_id
        ).first()
        if not module:
            raise HTTPException(status_code=404, detail="Module not found")

        # Get content for this module
        content = db.query(CourseContent).filter(
            CourseContent.module_id == module.id
        ).order_by(CourseContent.order).all()

        result = {
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order": module.order,
            "content_type": module.content_type,
            "estimated_duration_minutes": module.estimated_duration_minutes,
            "is_required": module.is_required,
            "content": [
                {
                    "id": c.id,
                    "title": c.title,
                    "content": c.content,
                    "content_type": c.content_type,
                    "order": c.order,
                    "media_urls": c.media_urls
                }
                for c in content
            ]
        }

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
