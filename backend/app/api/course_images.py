from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.learning import Enrollment

router = APIRouter()

class CourseImageCreate(BaseModel):
    src: str
    alt: str
    page: int

class CourseImageResponse(BaseModel):
    id: int
    src: str
    alt: str
    page: int
    course_id: int

class CourseImageUpdate(BaseModel):
    src: Optional[str] = None
    alt: Optional[str] = None
    page: Optional[int] = None

# In-memory storage for course images (in production, use database)
course_images_storage = {
    "2": [  # Course 2 - Forward Tipping Dumper Training
        {
            "id": 1,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper in Action",
            "page": 1,
            "course_id": 2
        },
        {
            "id": 2,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper Training",
            "page": 2,
            "course_id": 2
        },
        {
            "id": 3,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper Safety",
            "page": 3,
            "course_id": 2
        },
        {
            "id": 4,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper Operation",
            "page": 4,
            "course_id": 2
        },
        {
            "id": 5,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper Page 5",
            "page": 5,
            "course_id": 2
        },
        {
            "id": 6,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper Page 6",
            "page": 6,
            "course_id": 2
        },
        {
            "id": 7,
            "src": "/images/equipment/forward-tipping-dumper.png",
            "alt": "Forward Tipping Dumper Page 7",
            "page": 7,
            "course_id": 2
        }
    ]
}

@router.get("/courses/{course_id}/images")
async def get_course_images(
    course_id: int,
    page: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get images for a course, optionally filtered by page"""
    # Check if user is enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=401,
            detail="Not enrolled in this course"
        )
    
    # Get images for the course
    course_key = str(course_id)
    if course_key not in course_images_storage:
        return []
    
    images = course_images_storage[course_key]
    
    # Filter by page if specified
    if page is not None:
        images = [img for img in images if img.get('page') == page]
    
    return images

@router.post("/courses/{course_id}/images")
async def add_course_image(
    course_id: int,
    image_data: CourseImageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an image to a course (instructor only)"""
    if current_user.role != 'instructor':
        raise HTTPException(
            status_code=403,
            detail="Only instructors can add course images"
        )
    
    # Initialize course images if not exists
    course_key = str(course_id)
    if course_key not in course_images_storage:
        course_images_storage[course_key] = []
    
    # Add new image
    new_image = {
        'id': len(course_images_storage[course_key]) + 1,
        'src': image_data.src,
        'alt': image_data.alt,
        'page': image_data.page,
        'course_id': course_id
    }
    
    course_images_storage[course_key].append(new_image)
    
    return new_image

@router.put("/courses/{course_id}/images/{image_id}")
async def update_course_image(
    course_id: int,
    image_id: int,
    image_data: CourseImageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a course image (instructor only)"""
    if current_user.role != 'instructor':
        raise HTTPException(
            status_code=403,
            detail="Only instructors can update course images"
        )
    
    course_key = str(course_id)
    if course_key not in course_images_storage:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Find and update image
    for i, image in enumerate(course_images_storage[course_key]):
        if image['id'] == image_id:
            if image_data.src is not None:
                image['src'] = image_data.src
            if image_data.alt is not None:
                image['alt'] = image_data.alt
            if image_data.page is not None:
                image['page'] = image_data.page
            
            course_images_storage[course_key][i] = image
            return image
    
    raise HTTPException(status_code=404, detail="Image not found")

@router.delete("/courses/{course_id}/images/{image_id}")
async def delete_course_image(
    course_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a course image (instructor only)"""
    if current_user.role != 'instructor':
        raise HTTPException(
            status_code=403,
            detail="Only instructors can delete course images"
        )
    
    course_key = str(course_id)
    if course_key not in course_images_storage:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Find and remove image
    for i, image in enumerate(course_images_storage[course_key]):
        if image['id'] == image_id:
            course_images_storage[course_key].pop(i)
            return {"message": "Image deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Image not found")
