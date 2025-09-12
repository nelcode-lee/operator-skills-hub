#!/usr/bin/env python3
"""
Script to create sample courses with proper descriptions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.course import Course
from app.models.user import User

def create_sample_courses():
    """Create sample courses with proper descriptions"""
    db = SessionLocal()
    
    try:
        # Get an instructor user
        instructor = db.query(User).filter(User.role == "instructor").first()
        if not instructor:
            print("❌ No instructor found. Please create an instructor first.")
            return
        
        print(f"Using instructor: {instructor.email}")
        
        # Sample courses to create
        sample_courses = [
            {
                "title": "CSCS Health & Safety Awareness",
                "description": "Comprehensive health and safety training for construction workers. Covers essential safety protocols, risk assessment, and emergency procedures.",
                "category": "Health & Safety",
                "difficulty_level": "beginner",
                "duration_hours": 8.0,
                "price": 150.0
            },
            {
                "title": "Construction Equipment Operation",
                "description": "Learn to safely operate various construction equipment including excavators, cranes, and heavy machinery. Includes practical assessments.",
                "category": "Technical",
                "difficulty_level": "intermediate", 
                "duration_hours": 12.0,
                "price": 250.0
            },
            {
                "title": "Site Management & Leadership",
                "description": "Advanced course for construction supervisors and managers. Covers team leadership, project management, and regulatory compliance.",
                "category": "Management",
                "difficulty_level": "advanced",
                "duration_hours": 16.0,
                "price": 400.0
            },
            {
                "title": "Environmental Compliance",
                "description": "Understanding environmental regulations and best practices in construction. Covers waste management, pollution control, and sustainability.",
                "category": "Environmental",
                "difficulty_level": "intermediate",
                "duration_hours": 6.0,
                "price": 120.0
            },
            {
                "title": "First Aid & Emergency Response",
                "description": "Essential first aid training for construction sites. Includes CPR, injury management, and emergency evacuation procedures.",
                "category": "Health & Safety",
                "difficulty_level": "beginner",
                "duration_hours": 4.0,
                "price": 80.0
            }
        ]
        
        created_count = 0
        for course_data in sample_courses:
            # Check if course already exists
            existing = db.query(Course).filter(
                Course.title == course_data["title"],
                Course.instructor_id == instructor.id
            ).first()
            
            if not existing:
                course = Course(
                    title=course_data["title"],
                    description=course_data["description"],
                    category=course_data["category"],
                    difficulty_level=course_data["difficulty_level"],
                    duration_hours=course_data["duration_hours"],
                    price=course_data["price"],
                    instructor_id=instructor.id,
                    status="published",
                    is_active=True
                )
                
                db.add(course)
                created_count += 1
                print(f"  ✅ Created: {course_data['title']}")
            else:
                print(f"  ⏭️  Already exists: {course_data['title']}")
        
        db.commit()
        print(f"\n🎉 Created {created_count} new courses!")
        
        # Show all courses
        print("\n📚 All courses:")
        courses = db.query(Course).filter(Course.instructor_id == instructor.id).all()
        for course in courses:
            print(f"  - {course.title} ({course.category}) - £{course.price}")
        
    except Exception as e:
        print(f"❌ Error creating courses: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_courses()


