#!/usr/bin/env python3
"""
Check all courses in the system
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import SessionLocal
from backend.app.models.course import Course, CourseFileContent
from backend.app.models.user import User
from backend.app.models.learning import Enrollment

def check_courses():
    """Check all courses in the system"""
    db = SessionLocal()
    
    try:
        print("🔍 Checking all courses in the system...")
        
        # Get all courses
        courses = db.query(Course).all()
        print(f"\n📚 Found {len(courses)} courses:")
        
        for course in courses:
            print(f"\n   ID: {course.id}")
            print(f"   Title: {course.title}")
            print(f"   Category: {course.category}")
            print(f"   Status: {course.status}")
            print(f"   Active: {course.is_active}")
            print(f"   Instructor ID: {course.instructor_id}")
            
            # Check for FTD in title
            if 'forward' in course.title.lower() or 'tipping' in course.title.lower() or 'dumper' in course.title.lower():
                print("   🎯 This looks like the Forward Tipping Dumper course!")
                
                # Check content
                content = db.query(CourseFileContent).filter(CourseFileContent.course_id == course.id).all()
                print(f"   Content items: {len(content)}")
                for item in content:
                    print(f"     - {item.title} ({item.content_type})")
        
        # Check users
        users = db.query(User).all()
        print(f"\n👥 Users in system: {len(users)}")
        for user in users:
            print(f"   ID: {user.id}, Email: {user.email}, Role: {user.role}")
        
        # Check enrollments
        enrollments = db.query(Enrollment).all()
        print(f"\n📝 Enrollments: {len(enrollments)}")
        for enrollment in enrollments:
            print(f"   User {enrollment.user_id} -> Course {enrollment.course_id}, Status: {enrollment.status}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_courses()
