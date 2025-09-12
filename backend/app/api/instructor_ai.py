"""
Instructor AI Workflow API Endpoints
Provides content generation and document processing for instructors
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import os
from pathlib import Path

from ..core.database import get_db
from ..api.auth import get_current_user
from ..services.simple_ai_generator import SimpleAIContentGenerator
from ..services.simple_rag_service import SimpleRAGService
from ..models.course import Course, CourseFileContent
from ..models.ai import ContentGeneration
from ..core.config import settings

router = APIRouter()


@router.post("/upload-document")
async def upload_document(
    course_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload and process a document for AI content generation"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can upload documents"
        )
    
    # Verify course ownership
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied"
        )
    
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/courses")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'txt'
        file_path = upload_dir / f"{course_id}_{file.filename}"
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create database record
        course_file = CourseFileContent(
            course_id=course_id,
            instructor_id=current_user.id,
            title=title,
            description=description,
            file_path=str(file_path),
            content_type=file_extension,
            file_size=len(content),
            is_active=True
        )
        
        db.add(course_file)
        db.commit()
        db.refresh(course_file)
        
        # Process document with RAG
        rag_service = SimpleRAGService(db)
        process_result = rag_service.process_uploaded_document(
            course_file.id, current_user.id
        )
        
        return {
            "status": "success",
            "file_id": course_file.id,
            "file_path": str(file_path),
            "processing_result": process_result,
            "message": "Document uploaded and processed successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )


@router.post("/generate-content")
async def generate_content(
    course_id: int = Form(...),
    content_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    additional_instructions: str = Form(""),
    use_rag: bool = Form(True),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate AI content for a course"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can generate content"
        )
    
    # Verify course ownership
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied"
        )
    
    try:
        if use_rag:
            # Use RAG service for content generation
            rag_service = SimpleRAGService(db)
            result = rag_service.generate_course_content(
                course_id=course_id,
                instructor_id=current_user.id,
                content_type=content_type,
                title=title,
                description=description,
                additional_instructions=additional_instructions,
                use_rag=True
            )
        else:
            # Use simple AI generator
            generator = SimpleAIContentGenerator()
            
            # Get course content for context
            course_files = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course_id,
                CourseFileContent.is_active == True
            ).all()
            
            # Combine content from course files
            combined_content = "\n\n".join([
                f"{file.title}: {file.description}" 
                for file in course_files
            ])
            
            if content_type == "learning_material":
                result = generator.generate_learning_material(
                    original_content=combined_content,
                    title=title,
                    description=description,
                    additional_instructions=additional_instructions
                )
            elif content_type == "lesson_plan":
                result = generator.generate_lesson_plan(
                    original_content=combined_content,
                    title=title,
                    description=description,
                    additional_instructions=additional_instructions
                )
            elif content_type == "knowledge_test":
                result = generator.generate_knowledge_test(
                    original_content=combined_content,
                    title=title,
                    description=description,
                    additional_instructions=additional_instructions,
                    question_count=settings.default_question_count
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid content type. Must be: learning_material, lesson_plan, or knowledge_test"
                )
            
            # Save to database
            content_generation = ContentGeneration(
                prompt=f"Generate {content_type} for course {course_id}",
                generated_content=result["content"],
                model_used=result.get("ai_model", settings.ai_model),
                content_type=content_type,
                course_id=course_id,
                is_approved=False
            )
            
            db.add(content_generation)
            db.commit()
            db.refresh(content_generation)
            
            result["generation_id"] = content_generation.id
        
        return {
            "status": "success",
            "content": result["content"],
            "content_type": content_type,
            "generation_id": result.get("generation_id"),
            "sources_used": result.get("sources_used", 0),
            "model_used": result.get("model_used", settings.ai_model)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating content: {str(e)}"
        )


@router.get("/content-generations")
async def get_content_generations(
    course_id: Optional[int] = None,
    content_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get AI-generated content for instructor review"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can view content generations"
        )
    
    try:
        query = db.query(ContentGeneration)
        
        # Filter by course if specified
        if course_id:
            # Verify course ownership
            course = db.query(Course).filter(
                Course.id == course_id,
                Course.instructor_id == current_user.id
            ).first()
            
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Course not found or access denied"
                )
            
            query = query.filter(ContentGeneration.course_id == course_id)
        
        # Filter by content type if specified
        if content_type:
            query = query.filter(ContentGeneration.content_type == content_type)
        
        # Get content generations
        generations = query.order_by(ContentGeneration.created_at.desc()).all()
        
        return [
            {
                "id": gen.id,
                "content_type": gen.content_type,
                "prompt": gen.prompt,
                "generated_content": gen.generated_content,
                "model_used": gen.model_used,
                "course_id": gen.course_id,
                "is_approved": gen.is_approved,
                "created_at": gen.created_at,
                "approved_at": gen.approved_at,
                "approved_by": gen.approved_by
            }
            for gen in generations
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving content generations: {str(e)}"
        )


@router.post("/approve-content/{generation_id}")
async def approve_content(
    generation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Approve AI-generated content"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can approve content"
        )
    
    try:
        # Get content generation
        generation = db.query(ContentGeneration).filter(
            ContentGeneration.id == generation_id
        ).first()
        
        if not generation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content generation not found"
            )
        
        # Verify course ownership
        course = db.query(Course).filter(
            Course.id == generation.course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this content"
            )
        
        # Approve content
        generation.is_approved = True
        generation.approved_by = current_user.id
        generation.approved_at = db.execute("SELECT NOW()").scalar()
        
        db.commit()
        
        return {
            "status": "success",
            "message": "Content approved successfully",
            "generation_id": generation_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving content: {str(e)}"
        )


@router.delete("/reject-content/{generation_id}")
async def reject_content(
    generation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Reject AI-generated content"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can reject content"
        )
    
    try:
        # Get content generation
        generation = db.query(ContentGeneration).filter(
            ContentGeneration.id == generation_id
        ).first()
        
        if not generation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content generation not found"
            )
        
        # Verify course ownership
        course = db.query(Course).filter(
            Course.id == generation.course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this content"
            )
        
        # Delete content generation
        db.delete(generation)
        db.commit()
        
        return {
            "status": "success",
            "message": "Content rejected and deleted",
            "generation_id": generation_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting content: {str(e)}"
        )


@router.get("/search-content")
async def search_content(
    course_id: int,
    query: str,
    top_k: int = 5,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Search for relevant content in course documents"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can search content"
        )
    
    # Verify course ownership
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied"
        )
    
    try:
        # Search content using RAG service
        rag_service = SimpleRAGService(db)
        results = rag_service.search_course_content(
            course_id=course_id,
            query=query,
            top_k=top_k
        )
        
        return {
            "status": "success",
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching content: {str(e)}"
        )


@router.get("/course-documents")
async def get_course_documents(
    course_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all documents for a course"""
    
    # Verify instructor access
    if current_user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can view course documents"
        )
    
    # Verify course ownership
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied"
        )
    
    try:
        documents = db.query(CourseFileContent).filter(
            CourseFileContent.course_id == course_id,
            CourseFileContent.is_active == True
        ).order_by(CourseFileContent.created_at.desc()).all()
        
        return [
            {
                "id": doc.id,
                "title": doc.title,
                "description": doc.description,
                "content_type": doc.content_type,
                "file_size": doc.file_size,
                "created_at": doc.created_at,
                "is_processed": doc.file_path is not None
            }
            for doc in documents
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving course documents: {str(e)}"
        )

