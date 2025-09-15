"""
Unified FastAPI app that adapts to environment.
Maintains full functionality locally while being deployment-friendly.
"""
import os
from fastapi import FastAPI, HTTPException, Depends, status, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import timedelta
from typing import Optional

# Environment detection
IS_PRODUCTION = os.getenv("RENDER") or os.getenv("RAILWAY") or os.getenv("VERCEL")
IS_LOCAL = not IS_PRODUCTION

# Try to import full functionality, fall back gracefully
try:
    from .auth_simple import authenticate_user, create_access_token, verify_token
    AUTH_AVAILABLE = True
except ImportError:
    AUTH_AVAILABLE = False

# Try to import database functionality
try:
    from .core.database import create_tables
    from .models import user, course
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False

# Try to import AI functionality
try:
    from .api import ai
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

# Create FastAPI application
app = FastAPI(
    title="Operator Skills Hub API",
    version="1.0.0",
    description=f"Construction Training Management Platform - {'Production' if IS_PRODUCTION else 'Local'} Mode"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if IS_PRODUCTION else [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
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
    if not AUTH_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not available"
        )
    
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
        "environment": "production" if IS_PRODUCTION else "local",
        "features": {
            "authentication": AUTH_AVAILABLE,
            "database": DATABASE_AVAILABLE,
            "ai": AI_AVAILABLE
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "version": "1.0.0",
        "environment": "production" if IS_PRODUCTION else "local",
        "features": {
            "auth_available": AUTH_AVAILABLE,
            "database_available": DATABASE_AVAILABLE,
            "ai_available": AI_AVAILABLE
        }
    }

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint for frontend connectivity."""
    return {
        "message": "Backend is reachable from frontend",
        "timestamp": "2025-09-15T13:00:00Z",
        "status": "success"
    }

# Authentication endpoints
if AUTH_AVAILABLE:
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

    @app.get("/api/auth/me", response_model=UserResponse)
    async def get_current_user_info(current_user: dict = Depends(get_current_user)):
        """Get current user information."""
        return UserResponse(
            email=current_user["email"],
            name=current_user["name"],
            role=current_user["role"]
        )

    @app.post("/api/user-profiles/register")
    async def register_user(user_data: dict):
        """Register a new user (simplified for demo)."""
        # For demo purposes, just return success
        # In a real app, this would create a user in the database
        return {
            "message": "Registration successful! Please use demo credentials to login.",
            "demo_credentials": {
                "admin": {"email": "admin@example.com", "password": "admin123"},
                "student": {"email": "student@example.com", "password": "student123"},
                "instructor": {"email": "instructor@example.com", "password": "instructor123"}
            }
        }

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

# Database-dependent endpoints
if DATABASE_AVAILABLE:
    @app.get("/api/courses")
    async def get_courses():
        """Get courses from database."""
        # This would connect to the actual database
        return {"message": "Courses endpoint - database available", "courses": []}

# AI-dependent endpoints  
if AI_AVAILABLE:
    @app.get("/api/ai/status")
    async def get_ai_status():
        """Get AI service status."""
        return {"message": "AI services available", "status": "ready"}

# Include S3 storage router
try:
    from .api.s3_storage import router as s3_router
    app.include_router(s3_router)
    print("✅ S3 storage router included successfully")
except ImportError as e:
    print(f"❌ Failed to import S3 storage router: {e}")
    pass
except Exception as e:
    print(f"❌ Error including S3 storage router: {e}")
    pass

# Basic S3 test endpoint
@app.get("/api/s3-test")
async def s3_test():
    """Test S3 connection without authentication."""
    try:
        from .core.s3 import s3_manager
        if s3_manager.s3_client:
            # Try to list buckets
            response = s3_manager.s3_client.list_buckets()
            bucket_names = [bucket['Name'] for bucket in response['Buckets']]
            return {
                "status": "success",
                "message": "S3 connection working",
                "buckets": bucket_names,
                "target_bucket": s3_manager.bucket_name
            }
        else:
            return {
                "status": "error",
                "message": "S3 client not initialized",
                "error": "Check AWS credentials"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": "S3 test failed",
            "error": str(e)
        }

# Simple S3 health check
@app.get("/api/s3-health")
async def s3_health():
    """Simple S3 health check."""
    return {"message": "S3 health endpoint working", "status": "ok"}

# Fallback endpoints for missing features
@app.get("/api/courses")
async def get_courses_fallback():
    """Fallback courses endpoint."""
    return {
        "message": "Courses endpoint - limited functionality",
        "courses": [],
        "note": "Full functionality available in local environment"
    }

@app.get("/api/learning/sessions")
async def get_learning_sessions_fallback():
    """Fallback learning sessions endpoint."""
    return {
        "message": "Learning sessions endpoint - limited functionality", 
        "sessions": [],
        "note": "Full functionality available in local environment"
    }
