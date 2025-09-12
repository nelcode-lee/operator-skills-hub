"""
User profile schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr


class UserProfileBase(BaseModel):
    """Base user profile schema."""
    first_name: str
    last_name: str
    phone: Optional[str] = None
    qualifications: Optional[str] = None
    bio: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    """User profile creation schema."""
    pass


class UserProfileUpdate(BaseModel):
    """User profile update schema."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    qualifications: Optional[str] = None
    bio: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    """User profile response schema."""
    id: int
    user_id: int
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserWithProfile(BaseModel):
    """User with profile information."""
    id: int
    email: EmailStr
    role: str
    cscs_card_number: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    profile: Optional[UserProfileResponse] = None
    
    class Config:
        from_attributes = True


class UserRegistration(BaseModel):
    """Complete user registration schema."""
    email: EmailStr
    password: str
    role: str
    cscs_card_number: Optional[str] = None
    first_name: str
    last_name: str
    phone: Optional[str] = None
    qualifications: Optional[str] = None



