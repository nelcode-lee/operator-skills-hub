"""
Simple authentication system for Render deployment.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from passlib.context import CryptContext
from jose import JWTError, jwt
import os

# Simple password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Demo users with properly hashed passwords (in production, this would be in a database)
DEMO_USERS = {
    "admin@example.com": {
        "email": "admin@example.com",
        "password": "$2b$12$ygrK3tnkU/r0EQ/yzvzpden1p3cbziC15DfmzdvnPWj4sam.mEluK",  # "admin123"
        "role": "admin",
        "name": "Admin User"
    },
    "student@example.com": {
        "email": "student@example.com", 
        "password": "$2b$12$Y1dhsDjFAQSL17uAzMcCV.wMgR4NbgKO7c8mKC4mrsgX76FE4MYeK",  # "student123"
        "role": "student",
        "name": "Student User"
    },
    "instructor@example.com": {
        "email": "instructor@example.com",
        "password": "$2b$12$E3YfPQn/tZ2hDid9q8VAieYXokFsAqFM01mRAzXet6imccmpqd6Y.",  # "instructor123"
        "role": "instructor", 
        "name": "Instructor User"
    }
}

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate a user with email and password."""
    user = DEMO_USERS.get(email)
    if not user:
        return None
    if not verify_password(password, user["password"]):  # Proper password verification
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return user data."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return DEMO_USERS.get(email)
    except JWTError:
        return None
