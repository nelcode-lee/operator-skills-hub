"""
Simplified FastAPI application for Railway deployment.
Only includes essential modules to reduce startup time.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import create_tables

# Import only essential API modules
from .api import auth, courses, users, learning, student_learning, student_enrollment, web_content

# Import only essential models
from .models import user, course, learning as learning_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    create_tables()
    yield
    # Shutdown
    pass


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Construction Training Management Platform - Railway Optimized",
    lifespan=lifespan
)

# Add CORS middleware with enhanced security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://operatorskillshub.com",
        "https://www.operatorskillshub.com",
        "https://*.vercel.app",  # Allow all Vercel domains
        "https://operator-skills-hub.vercel.app",  # Your specific Vercel domain
        "https://*.up.railway.app"  # Allow all Railway domains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Authorization", 
        "Content-Type", 
        "X-Requested-With",
        "X-CSRF-Token",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["X-Total-Count", "X-Page-Count"]
)

# Add trusted host middleware with enhanced security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost", 
        "127.0.0.1", 
        "operatorskillshub.com", 
        "www.operatorskillshub.com",
        "*.up.railway.app"  # Allow Railway domains
    ]
)

# Include only essential API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(student_learning.router, prefix="/api/learning", tags=["Student Learning"])
app.include_router(student_enrollment.router, prefix="/api/learning", tags=["Student Enrollment"])
app.include_router(web_content.router, prefix="/api", tags=["Web Content"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Operator Skills Hub API - Railway Optimized",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.app_version}
