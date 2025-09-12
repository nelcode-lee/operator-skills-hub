"""
Main FastAPI application for Operator Skills Hub.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import create_tables
from .api import auth, courses, users, learning, ai, course_management, user_profiles, content_management, instructor_ai, pdf_serve, student_learning, student_enrollment, assessments, learning_analytics, course_requests, web_content, image_serve, course_images, messaging, analytics, time_tracking, security

# Import all models to ensure they are registered with SQLAlchemy
from .models import user, course, learning as learning_models, course_request, messaging as messaging_models, analytics as analytics_models


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
    description="Construction Training Management Platform with AI Integration",
    lifespan=lifespan
)

# Add CORS middleware with enhanced security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "https://operatorskillshub.com",
        "https://www.operatorskillshub.com"
    ],  # Removed wildcard "*" for security
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Specific methods only
    allow_headers=[
        "Authorization", 
        "Content-Type", 
        "X-Requested-With",
        "X-CSRF-Token"
    ],  # Specific headers only
    expose_headers=["X-Total-Count", "X-Page-Count"]
)

# Add trusted host middleware with enhanced security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "localhost", 
        "127.0.0.1", 
        "operatorskillshub.com", 
        "www.operatorskillshub.com"
    ]  # Removed wildcard "*" for security
)

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(user_profiles.router, prefix="/api/user-profiles", tags=["User Profiles"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(instructor_ai.router, prefix="/api/instructor-ai", tags=["Instructor AI"])
app.include_router(pdf_serve.router, prefix="/api", tags=["PDF Serving"])
app.include_router(student_learning.router, prefix="/api/learning", tags=["Student Learning"])
app.include_router(student_enrollment.router, prefix="/api/learning", tags=["Student Enrollment"])
app.include_router(assessments.router, prefix="/api/learning", tags=["Assessments"])
app.include_router(learning_analytics.router, prefix="/api/learning", tags=["Learning Analytics"])
app.include_router(course_management.router, prefix="/api/course-management", tags=["Course Management"])
app.include_router(content_management.router, prefix="/api/content", tags=["Content Management"])
app.include_router(course_requests.router, prefix="/api/course-requests", tags=["Course Requests"])
app.include_router(web_content.router, prefix="/api", tags=["Web Content"])
app.include_router(image_serve.router, prefix="/api", tags=["Images"])
app.include_router(course_images.router, prefix="/api", tags=["Course Images"])
app.include_router(messaging.router, prefix="/api/messaging", tags=["Messaging & Q&A"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics & Reporting"])
app.include_router(time_tracking.router, prefix="/api/time-tracking", tags=["Time Tracking"])
app.include_router(security.router, prefix="/api/security", tags=["Security"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Operator Skills Hub API",
        "version": settings.app_version,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.app_version}
