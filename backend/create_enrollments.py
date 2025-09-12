#!/usr/bin/env python3
"""
Script to create diverse enrollments across different courses
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.learning import Enrollment
import random

def create_diverse_enrollments():
    """Create enrollments across different courses"""
    db = SessionLocal()
    
    try:
        # Get students and courses
        students = db.query(User).filter(User.role == "student").all()
        courses = db.query(Course).filter(Course.is_active == True).all()
        
        print(f"Found {len(students)} students and {len(courses)} courses")
        
        if not students or not courses:
            print("❌ Need both students and courses to create enrollments")
            return
        
        # Create diverse enrollments
        enrollment_count = 0
        
        # Enroll each student in 2-3 random courses
        for student in students:
            # Pick 2-3 random courses for each student
            num_courses = random.randint(2, min(3, len(courses)))
            selected_courses = random.sample(courses, num_courses)
            
            for course in selected_courses:
                # Check if already enrolled
                existing = db.query(Enrollment).filter(
                    Enrollment.user_id == student.id,
                    Enrollment.course_id == course.id
                ).first()
                
                if not existing:
                    # Random progress between 0-100
                    progress = random.uniform(0, 100)
                    
                    enrollment = Enrollment(
                        user_id=student.id,
                        course_id=course.id,
                        status="active",
                        progress=progress
                    )
                    
                    db.add(enrollment)
                    enrollment_count += 1
                    print(f"  ✅ {student.email} → {course.title} ({progress:.1f}% progress)")
        
        db.commit()
        print(f"\n🎉 Created {enrollment_count} new enrollments!")
        
        # Show enrollment summary by course
        print("\n📊 Enrollment summary by course:")
        for course in courses:
            count = db.query(Enrollment).filter(
                Enrollment.course_id == course.id,
                Enrollment.status == "active"
            ).count()
            if count > 0:
                print(f"  - {course.title}: {count} students")
        
    except Exception as e:
        print(f"❌ Error creating enrollments: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_diverse_enrollments()


