"""
User profile management API endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.user import User, UserProfile
from ..schemas.user import (
    UserProfileCreate, 
    UserProfileUpdate, 
    UserProfileResponse,
    UserWithProfile,
    UserRegistration
)
from ..api.auth import get_current_user
from ..services.auth import get_password_hash

router = APIRouter()


@router.post("/register", response_model=UserWithProfile)
async def register_user_with_profile(
    user_data: UserRegistration, 
    db: Session = Depends(get_db)
):
    """Register a new user with complete profile information."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if CSCS card number already exists (if provided)
    if user_data.cscs_card_number:
        existing_cscs = db.query(User).filter(
            User.cscs_card_number == user_data.cscs_card_number
        ).first()
        if existing_cscs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSCS card number already registered"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        cscs_card_number=user_data.cscs_card_number,
        is_active=True
    )
    
    db.add(db_user)
    db.flush()  # Get the user ID
    
    # Create user profile
    db_profile = UserProfile(
        user_id=db_user.id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        qualifications=user_data.qualifications
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_user)
    db.refresh(db_profile)
    
    return UserWithProfile(
        id=db_user.id,
        email=db_user.email,
        role=db_user.role,
        cscs_card_number=db_user.cscs_card_number,
        is_active=db_user.is_active,
        is_verified=db_user.is_verified,
        created_at=db_user.created_at,
        updated_at=db_user.updated_at,
        profile=UserProfileResponse(
            id=db_profile.id,
            user_id=db_profile.user_id,
            first_name=db_profile.first_name,
            last_name=db_profile.last_name,
            phone=db_profile.phone,
            qualifications=db_profile.qualifications,
            bio=db_profile.bio,
            profile_image_url=db_profile.profile_image_url,
            created_at=db_profile.created_at,
            updated_at=db_profile.updated_at
        )
    )


@router.get("/me", response_model=UserWithProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's complete profile information."""
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    profile_response = None
    if profile:
        profile_response = UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            first_name=profile.first_name,
            last_name=profile.last_name,
            phone=profile.phone,
            qualifications=profile.qualifications,
            bio=profile.bio,
            profile_image_url=profile.profile_image_url,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
    
    return UserWithProfile(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        cscs_card_number=current_user.cscs_card_number,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        profile=profile_response
    )


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile information."""
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update only provided fields
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    
    return UserProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        phone=profile.phone,
        qualifications=profile.qualifications,
        bio=profile.bio,
        profile_image_url=profile.profile_image_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )


@router.post("/profile", response_model=UserProfileResponse)
async def create_user_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a profile for the current user."""
    # Check if profile already exists
    existing_profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT to update."
        )
    
    # Create new profile
    db_profile = UserProfile(
        user_id=current_user.id,
        first_name=profile_data.first_name,
        last_name=profile_data.last_name,
        phone=profile_data.phone,
        qualifications=profile_data.qualifications,
        bio=profile_data.bio
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    return UserProfileResponse(
        id=db_profile.id,
        user_id=db_profile.user_id,
        first_name=db_profile.first_name,
        last_name=db_profile.last_name,
        phone=db_profile.phone,
        qualifications=db_profile.qualifications,
        bio=db_profile.bio,
        profile_image_url=db_profile.profile_image_url,
        created_at=db_profile.created_at,
        updated_at=db_profile.updated_at
    )
