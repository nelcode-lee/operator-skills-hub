"""
Course Content Management API
Handles RAG-based content generation, document processing, and content management
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from ..core.database import get_db
from ..api.auth import get_current_user
from ..models.user import User
from ..models.course import Course, CourseFileContent, CourseContent, CourseModule
from ..models.ai import ContentGeneration
# from ..services.rag_service import RAGService  # Temporarily disabled
from ..services.pdf_processor import PDFProcessor, CourseAccessManager

router = APIRouter()


# Request/Response Models
class ContentGenerationRequest(BaseModel):
    content_type: str  # learning_material, lesson_plan, knowledge_test
    title: str
    description: str
    additional_instructions: Optional[str] = ""
    use_rag: bool = True

class ContentGenerationResponse(BaseModel):
    status: str
    content: str
    content_type: str
    generation_id: int
    sources_used: int
    model_used: str

class DocumentProcessRequest(BaseModel):
    content_id: int

class DocumentProcessResponse(BaseModel):
    status: str
    document_id: str
    chunks_created: int
    message: str

class ContentSearchRequest(BaseModel):
    query: str
    top_k: int = 5

class ContentSearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total_found: int

class CourseContentResponse(BaseModel):
    id: int
    title: str
    description: str
    content_type: str
    file_path: Optional[str]
    file_size: Optional[int]
    page_count: Optional[int]
    created_at: str
    file_metadata: Optional[Dict[str, Any]]
    is_processed: bool = False

class ModuleContentRequest(BaseModel):
    module_id: int
    title: str
    content: str
    content_type: str = "text"
    order: int = 0
    is_ai_generated: bool = False

class ModuleContentResponse(BaseModel):
    id: int
    module_id: int
    title: str
    content: str
    content_type: str
    order: int
    is_ai_generated: bool
    created_at: str


# Document Processing Endpoints
@router.post("/documents/{content_id}/process", response_model=DocumentProcessResponse)
async def process_document(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process uploaded document and create embeddings for RAG"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can process documents"
        )
    
    try:
        # RAG service temporarily disabled
        # rag_service = RAGService(db)
        # result = rag_service.process_uploaded_document(content_id, current_user.id)
        
        # if "error" in result:
        #     raise HTTPException(status_code=400, detail=result["error"])
        
        # return DocumentProcessResponse(**result)
        return DocumentProcessResponse(
            status="success",
            document_id=f"doc_{content_id}",
            chunks_created=0,
            message="Document processing temporarily disabled - RAG service not available"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/documents/upload", response_model=CourseContentResponse)
async def upload_document(
    course_id: int = Form(...),
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a document for course content"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can upload documents"
        )
    
    try:
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
        
        # Process PDF upload
        pdf_processor = PDFProcessor()
        result = await pdf_processor.process_pdf(file, course_id, current_user.id)
        
        # Save to database
        content = CourseFileContent(
            course_id=course_id,
            instructor_id=current_user.id,
            title=title,
            description=description,
            content_type="pdf",
            file_path=result["file_path"],
            file_size=result["file_size"],
            page_count=result["page_count"],
            file_metadata={
                "original_filename": file.filename,
                "file_id": result["file_id"]
            },
            is_active=True
        )
        
        db.add(content)
        db.commit()
        db.refresh(content)
        
        return CourseContentResponse(
            id=content.id,
            title=content.title,
            description=content.description,
            content_type=content.content_type,
            file_path=content.file_path,
            file_size=content.file_size,
            page_count=content.page_count,
            created_at=content.created_at.isoformat(),
            file_metadata=content.file_metadata,
            is_processed=False
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/documents", response_model=List[CourseContentResponse])
async def get_course_documents(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for a course"""
    try:
        # Check access
        access_manager = CourseAccessManager(db)
        
        if current_user.role == "instructor":
            # Instructors can see all their documents
            documents = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course_id,
                CourseFileContent.instructor_id == current_user.id
            ).all()
        else:
            # Students can only see active documents they have access to
            if not access_manager.get_student_access(course_id, current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
            
            documents = db.query(CourseFileContent).filter(
                CourseFileContent.course_id == course_id,
                CourseFileContent.is_active == True
            ).all()
        
        return [
            CourseContentResponse(
                id=doc.id,
                title=doc.title,
                description=doc.description,
                content_type=doc.content_type,
                file_path=doc.file_path,
                file_size=doc.file_size,
                page_count=doc.page_count,
                created_at=doc.created_at.isoformat(),
                file_metadata=doc.file_metadata,
                is_processed=False  # This would need to be checked against vector store
            )
            for doc in documents
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Content Generation Endpoints
@router.post("/courses/{course_id}/generate-content", response_model=ContentGenerationResponse)
async def generate_course_content(
    course_id: int,
    request: ContentGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate course content using RAG and AI"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can generate content"
        )
    
    try:
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
        
        # RAG service temporarily disabled
        # rag_service = RAGService(db)
        # result = rag_service.generate_course_content(...)
        
        # Mock response for now
        return ContentGenerationResponse(
            status="success",
            content="RAG content generation temporarily disabled. Please install AI dependencies to enable this feature.",
            content_type=request.content_type,
            generation_id=0,
            sources_used=0,
            model_used="disabled"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/generated-content", response_model=List[Dict[str, Any]])
async def get_generated_content(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all generated content for a course"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can view generated content"
        )
    
    try:
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
        
        # Get generated content
        generations = db.query(ContentGeneration).filter(
            ContentGeneration.course_id == course_id
        ).order_by(ContentGeneration.created_at.desc()).all()
        
        return [
            {
                "id": gen.id,
                "content_type": gen.content_type,
                "generated_content": gen.generated_content,
                "model_used": gen.model_used,
                "is_approved": gen.is_approved,
                "created_at": gen.created_at.isoformat(),
                "approved_by": gen.approved_by
            }
            for gen in generations
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generated-content/{generation_id}/approve")
async def approve_generated_content(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve generated content for use in course"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can approve content"
        )
    
    try:
        generation = db.query(ContentGeneration).filter(
            ContentGeneration.id == generation_id
        ).first()
        
        if not generation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Generated content not found"
            )
        
        # Verify course ownership
        course = db.query(Course).filter(
            Course.id == generation.course_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Approve content
        generation.is_approved = True
        generation.approved_by = current_user.id
        db.commit()
        
        return {"status": "success", "message": "Content approved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Content Search Endpoints
@router.post("/courses/{course_id}/search", response_model=ContentSearchResponse)
async def search_course_content(
    course_id: int,
    request: ContentSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for relevant content within a course using RAG"""
    try:
        # Check access
        access_manager = CourseAccessManager(db)
        
        if current_user.role == "instructor":
            # Instructors can search their own courses
            course = db.query(Course).filter(
                Course.id == course_id,
                Course.instructor_id == current_user.id
            ).first()
            
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Course not found or access denied"
                )
        else:
            # Students can search courses they have access to
            if not access_manager.get_student_access(course_id, current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        # Search using RAG
        rag_service = RAGService(db)
        results = rag_service.search_course_content(
            course_id=course_id,
            query=request.query,
            top_k=request.top_k
        )
        
        return ContentSearchResponse(
            results=results,
            total_found=len(results)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Module Content Management
@router.post("/modules/{module_id}/content", response_model=ModuleContentResponse)
async def add_module_content(
    module_id: int,
    request: ModuleContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add content to a course module"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can add module content"
        )
    
    try:
        # Verify module ownership
        module = db.query(CourseModule).join(Course).filter(
            CourseModule.id == module_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found or access denied"
            )
        
        # Create content
        content = CourseContent(
            module_id=module_id,
            title=request.title,
            content=request.content,
            content_type=request.content_type,
            order=request.order,
            is_ai_generated=request.is_ai_generated
        )
        
        db.add(content)
        db.commit()
        db.refresh(content)
        
        return ModuleContentResponse(
            id=content.id,
            module_id=content.module_id,
            title=content.title,
            content=content.content,
            content_type=content.content_type,
            order=content.order,
            is_ai_generated=content.is_ai_generated,
            created_at=content.created_at.isoformat()
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modules/{module_id}/content", response_model=List[ModuleContentResponse])
async def get_module_content(
    module_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all content for a module"""
    try:
        # Check access
        module = db.query(CourseModule).join(Course).filter(
            CourseModule.id == module_id
        ).first()
        
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        
        # Check permissions
        if current_user.role == "instructor":
            if module.course.instructor_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        else:
            # Students need enrollment
            access_manager = CourseAccessManager(db)
            if not access_manager.get_student_access(module.course_id, current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        
        # Get content
        content = db.query(CourseContent).filter(
            CourseContent.module_id == module_id
        ).order_by(CourseContent.order).all()
        
        return [
            ModuleContentResponse(
                id=item.id,
                module_id=item.module_id,
                title=item.title,
                content=item.content,
                content_type=item.content_type,
                order=item.order,
                is_ai_generated=item.is_ai_generated,
                created_at=item.created_at.isoformat()
            )
            for item in content
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/content/{content_id}")
async def update_module_content(
    content_id: int,
    request: ModuleContentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update module content"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can update content"
        )
    
    try:
        # Verify content ownership
        content = db.query(CourseContent).join(CourseModule).join(Course).filter(
            CourseContent.id == content_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found or access denied"
            )
        
        # Update content
        content.title = request.title
        content.content = request.content
        content.content_type = request.content_type
        content.order = request.order
        content.is_ai_generated = request.is_ai_generated
        
        db.commit()
        
        return {"status": "success", "message": "Content updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/content/{content_id}")
async def delete_module_content(
    content_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete module content"""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can delete content"
        )
    
    try:
        # Verify content ownership
        content = db.query(CourseContent).join(CourseModule).join(Course).filter(
            CourseContent.id == content_id,
            Course.instructor_id == current_user.id
        ).first()
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found or access denied"
            )
        
        # Delete content
        db.delete(content)
        db.commit()
        
        return {"status": "success", "message": "Content deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
