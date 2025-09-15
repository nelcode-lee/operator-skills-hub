"""
FastAPI app for Render deployment with authentication.
"""
from fastapi import FastAPI, HTTPException, Depends, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import timedelta
from typing import Optional
from .auth_simple import authenticate_user, create_access_token, verify_token

# Create FastAPI application
app = FastAPI(
    title="Operator Skills Hub API",
    version="1.0.0",
    description="Construction Training Management Platform"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    email: str
    name: str
    role: str

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token."""
    token = credentials.credentials
    user = verify_token(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Operator Skills Hub API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login endpoint with demo credentials."""
    user = authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"]
    )

@app.post("/api/auth/token", response_model=LoginResponse)
async def token_login(username: str = Form(...), password: str = Form(...)):
    """Token endpoint for form data login (frontend compatibility)."""
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    )

@app.get("/api/demo-credentials")
async def get_demo_credentials():
    """Get demo login credentials."""
    return {
        "demo_users": [
            {
                "email": "admin@example.com",
                "password": "admin123",
                "role": "admin",
                "name": "Admin User"
            },
            {
                "email": "student@example.com", 
                "password": "student123",
                "role": "student",
                "name": "Student User"
            },
            {
                "email": "instructor@example.com",
                "password": "instructor123", 
                "role": "instructor",
                "name": "Instructor User"
            }
        ]
    }
