from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from pathlib import Path
from jose import JWTError, jwt
from datetime import datetime

from ..core.database import get_db
from ..core.auth import get_current_user, verify_token
from ..core.config import settings
from ..models.user import User
from ..models.learning import Enrollment

router = APIRouter()

@router.get("/courses/{course_id}/images/{image_filename}")
async def serve_course_image(
    course_id: int,
    image_filename: str,
    token: str = Query(None, description="JWT token for authentication"),
    db: Session = Depends(get_db)
):
    """
    Serve images from the converted web content for enrolled students.
    """
    # Authenticate user from token
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required."
        )
    
    try:
        # Verify the token and get user info
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token."
            )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token."
        )
    
    # Get user by email
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found."
        )
    
    # Check if the user is enrolled in the course
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=401,
            detail="Not enrolled in this course or course not found."
        )
    
    # Construct the image path
    # Get the backend directory (parent of app directory)
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    image_path = os.path.join(backend_dir, "converted_content", "images", image_filename)
    
    # Check if the image exists
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail="Image not found."
        )
    
    # Return the image file
    return FileResponse(
        image_path,
        media_type="image/png",
        filename=image_filename
    )

