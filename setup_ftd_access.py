#!/usr/bin/env python3
"""
Setup script to ensure Forward Tipping Dumper course is accessible to students
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import SessionLocal
from backend.app.models.user import User
from backend.app.models.course import Course, CourseFileContent
from backend.app.models.learning import Enrollment
from backend.app.services.auth import get_password_hash
from datetime import datetime

def setup_ftd_access():
    """Setup Forward Tipping Dumper course access for students"""
    db = SessionLocal()
    
    try:
        print("🔧 Setting up Forward Tipping Dumper course access...")
        
        # 1. Check if FTD course exists
        ftd_course = db.query(Course).filter(Course.id == 2).first()
        if not ftd_course:
            print("❌ Forward Tipping Dumper course not found!")
            return False
        
        print(f"✅ Found FTD course: {ftd_course.title}")
        print(f"   Status: {ftd_course.status}")
        print(f"   Active: {ftd_course.is_active}")
        
        # 2. Ensure course is published and active
        if ftd_course.status != 'published' or not ftd_course.is_active:
            ftd_course.status = 'published'
            ftd_course.is_active = True
            db.commit()
            print("✅ Updated course status to published and active")
        
        # 3. Check course content
        content = db.query(CourseFileContent).filter(CourseFileContent.course_id == 2).all()
        print(f"📚 Course content: {len(content)} items")
        
        for item in content:
            print(f"   - {item.title} ({item.content_type})")
            if item.file_path and os.path.exists(item.file_path):
                print(f"     ✅ File exists: {item.file_path}")
            else:
                print(f"     ❌ File missing: {item.file_path}")
        
        # 4. Check for students
        students = db.query(User).filter(User.role == 'student').all()
        print(f"👥 Students in system: {len(students)}")
        
        for student in students:
            print(f"   - {student.email} (ID: {student.id})")
            
            # Check if student is enrolled
            enrollment = db.query(Enrollment).filter(
                Enrollment.user_id == student.id,
                Enrollment.course_id == 2
            ).first()
            
            if enrollment:
                print(f"     ✅ Already enrolled (Status: {enrollment.status})")
            else:
                # Create enrollment
                new_enrollment = Enrollment(
                    user_id=student.id,
                    course_id=2,
                    status='active',
                    enrolled_at=datetime.utcnow(),
                    progress=0.0
                )
                db.add(new_enrollment)
                print(f"     ➕ Created enrollment")
        
        # 5. Commit changes
        db.commit()
        print("✅ All changes committed to database")
        
        # 6. Summary
        print("\n📋 Summary:")
        print(f"   Course: {ftd_course.title} (ID: {ftd_course.id})")
        print(f"   Status: {ftd_course.status}")
        print(f"   Content items: {len(content)}")
        print(f"   Students enrolled: {len(students)}")
        
        print("\n🎉 Forward Tipping Dumper course is ready for student access!")
        print("   Students can now access the course at: http://localhost:3000/student-portal")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    setup_ftd_access()
