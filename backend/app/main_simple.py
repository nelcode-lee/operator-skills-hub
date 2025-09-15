"""
Ultra-simple FastAPI app for Render deployment testing.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI application
app = FastAPI(
    title="Operator Skills Hub API",
    version="1.0.0",
    description="Construction Training Management Platform - Simple Version"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Operator Skills Hub API - Simple Version",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/test")
async def test():
    """Test endpoint."""
    return {"message": "Backend is working!", "platform": "Render"}
