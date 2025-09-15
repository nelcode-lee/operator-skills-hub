"""
Main FastAPI application for Operator Skills Hub.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import create_tables
from .api import auth, courses, users, learning, ai, course_management, user_profiles, content_management, instructor_ai, pdf_serve, student_learning, student_enrollment, assessments, learning_analytics, course_requests, web_content, image_serve, course_images, messaging, analytics, time_tracking, security, schedule

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

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(user_profiles.router, prefix="/api/user-profiles", tags=["User Profiles"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
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
app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule & Events"])


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

@app.get("/api/env-check")
async def env_check():
    """Check environment variables for debugging."""
    import os
    return {
        "aws_access_key_id": "✅ Set" if os.getenv("AWS_ACCESS_KEY_ID") else "❌ Not set",
        "aws_secret_access_key": "✅ Set" if os.getenv("AWS_SECRET_ACCESS_KEY") else "❌ Not set",
        "aws_region": os.getenv("AWS_REGION", "Not set"),
        "s3_bucket_name": os.getenv("S3_BUCKET_NAME", "Not set"),
        "render_env": os.getenv("RENDER", "Not set"),
        "all_env_vars": {k: v for k, v in os.environ.items() if "AWS" in k or "S3" in k}
    }
