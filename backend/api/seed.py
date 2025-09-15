"""
API endpoint to seed the database with demo data.
This can be called manually or during deployment.
"""
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from ..core.database import engine
import subprocess
import sys
import os

router = APIRouter()

@router.post("/seed-database")
async def seed_database():
    """Seed the database with demo data if it's empty."""
    try:
        with engine.connect() as conn:
            # Check if courses table exists and has data
            result = conn.execute(text("SELECT COUNT(*) FROM courses WHERE is_active = true"))
            course_count = result.scalar()
            
            if course_count > 0:
                return {
                    "message": f"Database already has {course_count} courses, skipping seed",
                    "course_count": course_count,
                    "status": "skipped"
                }
            
            print("🌱 No courses found, seeding database with demo data...")
            
            # Run the seed script
            seed_script_path = os.path.join(os.path.dirname(__file__), "..", "..", "seed_demo_data.py")
            
            result = subprocess.run([
                sys.executable, seed_script_path
            ], cwd=os.path.dirname(seed_script_path), 
               capture_output=True, text=True)
            
            if result.returncode == 0:
                # Check course count again
                result = conn.execute(text("SELECT COUNT(*) FROM courses WHERE is_active = true"))
                new_course_count = result.scalar()
                
                return {
                    "message": "Database seeded successfully!",
                    "course_count": new_course_count,
                    "status": "seeded",
                    "output": result.stdout
                }
            else:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Seeding failed: {result.stderr}"
                )
                
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Could not seed database: {str(e)}"
        )

@router.get("/seed-status")
async def get_seed_status():
    """Check if the database has been seeded."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM courses WHERE is_active = true"))
            course_count = result.scalar()
            
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            
            return {
                "course_count": course_count,
                "user_count": user_count,
                "is_seeded": course_count > 0,
                "status": "seeded" if course_count > 0 else "empty"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Could not check database status: {str(e)}"
        )
