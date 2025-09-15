"""
S3 storage API endpoints for course content management.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import uuid
from datetime import datetime

from app.core.s3 import s3_manager
from app.auth_simple import get_current_user

router = APIRouter(prefix="/api/storage", tags=["storage"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a file to S3 storage.
    
    Args:
        file: The file to upload
        folder: S3 folder path (e.g., "courses", "documents", "images")
        current_user: Current authenticated user
    """
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Create S3 key with folder structure
        s3_key = f"{folder}/{datetime.now().year}/{datetime.now().month:02d}/{unique_filename}"
        
        # Determine content type
        content_type = file.content_type or "application/octet-stream"
        
        # Upload to S3
        result = s3_manager.upload_fileobj(
            file.file,
            s3_key,
            content_type
        )
        
        if result["success"]:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "File uploaded successfully",
                    "file_info": {
                        "original_filename": file.filename,
                        "s3_key": s3_key,
                        "url": result["url"],
                        "size": file.size,
                        "content_type": content_type,
                        "uploaded_by": current_user["email"],
                        "uploaded_at": datetime.now().isoformat()
                    }
                }
            )
        else:
            raise HTTPException(status_code=500, detail=f"Upload failed: {result['error']}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@router.post("/upload-course-content")
async def upload_course_content(
    file: UploadFile = File(...),
    course_id: int = Form(...),
    content_type: str = Form("pdf"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload course content to S3 with course-specific organization.
    
    Args:
        file: The course content file
        course_id: ID of the course
        content_type: Type of content (pdf, video, image, etc.)
        current_user: Current authenticated user
    """
    try:
        # Generate filename with course ID
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"course_{course_id}_{uuid.uuid4()}{file_extension}"
        
        # Create S3 key for course content
        s3_key = f"courses/{course_id}/{content_type}s/{unique_filename}"
        
        # Determine MIME type
        mime_type = file.content_type or "application/octet-stream"
        
        # Upload to S3
        result = s3_manager.upload_fileobj(
            file.file,
            s3_key,
            mime_type
        )
        
        if result["success"]:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Course content uploaded successfully",
                    "content_info": {
                        "course_id": course_id,
                        "content_type": content_type,
                        "original_filename": file.filename,
                        "s3_key": s3_key,
                        "url": result["url"],
                        "size": file.size,
                        "mime_type": mime_type,
                        "uploaded_by": current_user["email"],
                        "uploaded_at": datetime.now().isoformat()
                    }
                }
            )
        else:
            raise HTTPException(status_code=500, detail=f"Upload failed: {result['error']}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@router.get("/list")
async def list_files(
    folder: str = "general",
    current_user: dict = Depends(get_current_user)
):
    """
    List files in a specific S3 folder.
    
    Args:
        folder: S3 folder path
        current_user: Current authenticated user
    """
    try:
        result = s3_manager.list_files(folder)
        
        if result["success"]:
            return JSONResponse(
                status_code=200,
                content={
                    "message": f"Files in folder '{folder}'",
                    "folder": folder,
                    "files": result["files"],
                    "count": len(result["files"])
                }
            )
        else:
            raise HTTPException(status_code=500, detail=f"Failed to list files: {result['error']}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List error: {str(e)}")

@router.get("/list-course-content/{course_id}")
async def list_course_content(
    course_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    List all content for a specific course.
    
    Args:
        course_id: ID of the course
        current_user: Current authenticated user
    """
    try:
        folder_prefix = f"courses/{course_id}/"
        result = s3_manager.list_files(folder_prefix)
        
        if result["success"]:
            return JSONResponse(
                status_code=200,
                content={
                    "message": f"Content for course {course_id}",
                    "course_id": course_id,
                    "content": result["files"],
                    "count": len(result["files"])
                }
            )
        else:
            raise HTTPException(status_code=500, detail=f"Failed to list course content: {result['error']}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List error: {str(e)}")

@router.delete("/delete/{s3_key:path}")
async def delete_file(
    s3_key: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a file from S3 storage.
    
    Args:
        s3_key: S3 object key (path in bucket)
        current_user: Current authenticated user
    """
    try:
        result = s3_manager.delete_file(s3_key)
        
        if result["success"]:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "File deleted successfully",
                    "deleted_key": s3_key,
                    "deleted_by": current_user["email"],
                    "deleted_at": datetime.now().isoformat()
                }
            )
        else:
            raise HTTPException(status_code=500, detail=f"Delete failed: {result['error']}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete error: {str(e)}")

@router.get("/presigned-url/{s3_key:path}")
async def get_presigned_url(
    s3_key: str,
    expiration: int = 3600,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a presigned URL for private file access.
    
    Args:
        s3_key: S3 object key
        expiration: URL expiration time in seconds (default: 1 hour)
        current_user: Current authenticated user
    """
    try:
        url = s3_manager.generate_presigned_url(s3_key, expiration)
        
        if url:
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Presigned URL generated",
                    "url": url,
                    "expires_in": expiration,
                    "generated_by": current_user["email"],
                    "generated_at": datetime.now().isoformat()
                }
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to generate presigned URL")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL generation error: {str(e)}")

@router.get("/health")
async def storage_health():
    """
    Check S3 storage health and connectivity.
    """
    try:
        if s3_manager.s3_client:
            # Try to list files to verify connection
            result = s3_manager.list_files("")
            if result["success"]:
                return JSONResponse(
                    status_code=200,
                    content={
                        "status": "healthy",
                        "service": "S3 Storage",
                        "bucket": s3_manager.bucket_name,
                        "region": s3_manager.aws_region,
                        "message": "S3 connection successful"
                    }
                )
            else:
                return JSONResponse(
                    status_code=503,
                    content={
                        "status": "unhealthy",
                        "service": "S3 Storage",
                        "error": result["error"],
                        "message": "S3 connection failed"
                    }
                )
        else:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "service": "S3 Storage",
                    "message": "S3 client not initialized - check AWS credentials"
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "service": "S3 Storage",
                "error": str(e),
                "message": "S3 health check failed"
            }
        )
