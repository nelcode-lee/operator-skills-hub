"""
User management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.user import User, UserProfile
from ..models.learning import Enrollment
from ..schemas.auth import UserResponse, UserCreate
from ..api.auth import get_current_user
from ..services.auth import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all users (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/students")
async def get_students(
    page: int = 1,
    limit: int = 10,
    search: str = "",
    status: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all students (instructor and admin only)."""
    if current_user.role not in ["instructor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Build query
    query = db.query(User).filter(User.role == "student")
    
    # Apply search filter
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%")
        )
    
    # Apply status filter
    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "inactive":
        query = query.filter(User.is_active == False)
    elif status == "verified":
        query = query.filter(User.is_verified == True)
    elif status == "unverified":
        query = query.filter(User.is_verified == False)
    
    # Get total count
    total = query.count()
    
    # Get students with pagination
    students = query.offset(offset).limit(limit).all()
    
    # Build response with additional data
    student_list = []
    for student in students:
        # Get user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
        
        # Get course enrollment count
        course_count = db.query(Enrollment).filter(
            Enrollment.user_id == student.id,
            Enrollment.status == "active"
        ).count()
        
        # Get completed courses count
        completed_count = db.query(Enrollment).filter(
            Enrollment.user_id == student.id,
            Enrollment.status == "completed"
        ).count()
        
        student_data = {
            "id": student.id,
            "email": student.email,
            "role": student.role,
            "is_active": student.is_active,
            "is_verified": student.is_verified,
            "created_at": student.created_at.isoformat(),
                   "profile": {
                       "first_name": profile.first_name if profile else None,
                       "last_name": profile.last_name if profile else None,
                       "phone_number": profile.phone if profile else None,
                       "cscs_card_number": student.cscs_card_number
                   },
            "courses_count": course_count,
            "completed_courses": completed_count
        }
        student_list.append(student_data)
    
    return {
        "students": student_list,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }


@router.get("/lookup/email/{email}", response_model=UserResponse)
async def get_user_by_email(
    email: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by email address."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Users can only view their own profile unless they're admin
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        cscs_card_number=user_data.cscs_card_number,
        is_active=True,
        is_verified=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a user (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    for field, value in user_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

