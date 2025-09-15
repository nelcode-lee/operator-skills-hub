#!/usr/bin/env python3
"""
Create Forward Tipping Dumper course and test data
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.core.database import SessionLocal, create_tables
from backend.app.models.user import User, UserProfile
from backend.app.models.course import Course, CourseFileContent
from backend.app.models.learning import Enrollment
from backend.app.services.auth import get_password_hash
from datetime import datetime

def create_ftd_course():
    """Create Forward Tipping Dumper course and test data"""
    
    # Create tables first
    create_tables()
    
    db = SessionLocal()
    
    try:
        print("🔧 Creating Forward Tipping Dumper course and test data...")
        
        # 1. Create instructor user
        instructor = db.query(User).filter(User.email == "instructor@example.com").first()
        if not instructor:
            instructor = User(
                email="instructor@example.com",
                hashed_password=get_password_hash("instructor123"),
                role="instructor",
                cscs_card_number="12345",
                is_active=True,
                is_verified=True
            )
            db.add(instructor)
            db.flush()  # Get the ID
            
            # Create instructor profile
            instructor_profile = UserProfile(
                user_id=instructor.id,
                first_name="Test",
                last_name="Instructor",
                phone="01234567890",
                qualifications="CPCS Instructor"
            )
            db.add(instructor_profile)
            print("✅ Created instructor user")
        else:
            print("✅ Instructor user already exists")
        
        # 2. Create student user
        student = db.query(User).filter(User.email == "student@example.com").first()
        if not student:
            student = User(
                email="student@example.com",
                hashed_password=get_password_hash("student123"),
                role="student",
                cscs_card_number="54321",
                is_active=True,
                is_verified=True
            )
            db.add(student)
            db.flush()  # Get the ID
            
            # Create student profile
            student_profile = UserProfile(
                user_id=student.id,
                first_name="Test",
                last_name="Student",
                phone="09876543210",
                qualifications="None"
            )
            db.add(student_profile)
            print("✅ Created student user")
        else:
            print("✅ Student user already exists")
        
        # 3. Create Forward Tipping Dumper course
        ftd_course = db.query(Course).filter(Course.title.ilike("%forward tipping dumper%")).first()
        if not ftd_course:
            ftd_course = Course(
                title="Forward Tipping Dumper",
                description="Comprehensive training course for Forward Tipping Dumper operation, covering safety procedures, operational techniques, and maintenance requirements.",
                category="Equipment Operation",
                difficulty_level="beginner",
                duration_hours=30.0,
                price=750.0,
                status="published",
                is_active=True,
                instructor_id=instructor.id,
                learning_objectives=[
                    "Understand Forward Tipping Dumper safety procedures",
                    "Master operational techniques and controls",
                    "Learn maintenance and inspection requirements",
                    "Complete practical assessments"
                ]
            )
            db.add(ftd_course)
            db.flush()  # Get the ID
            print("✅ Created Forward Tipping Dumper course")
        else:
            print("✅ Forward Tipping Dumper course already exists")
        
        # 4. Create course content (PDF files)
        pdf_files = [
            "2_l-600-0547-know-how-to-operate-a-forward-tipping-dumper.pdf",
            "2_Learner Workbook FTD v4 June 2025.pdf"
        ]
        
        for pdf_file in pdf_files:
            file_path = f"backend/uploads/courses/{pdf_file}"
            if os.path.exists(file_path):
                content = db.query(CourseFileContent).filter(
                    CourseFileContent.course_id == ftd_course.id,
                    CourseFileContent.title == pdf_file
                ).first()
                
                if not content:
                    content = CourseFileContent(
                        course_id=ftd_course.id,
                        instructor_id=instructor.id,
                        title=pdf_file,
                        description=f"Learning material for {pdf_file}",
                        content_type="pdf",
                        file_path=file_path,
                        file_size=os.path.getsize(file_path),
                        page_count=50,  # Estimated
                        is_active=True
                    )
                    db.add(content)
                    print(f"✅ Added content: {pdf_file}")
                else:
                    print(f"✅ Content already exists: {pdf_file}")
            else:
                print(f"⚠️  File not found: {file_path}")
        
        # 5. Enroll student in course
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == student.id,
            Enrollment.course_id == ftd_course.id
        ).first()
        
        if not enrollment:
            enrollment = Enrollment(
                user_id=student.id,
                course_id=ftd_course.id,
                status="active",
                enrolled_at=datetime.utcnow(),
                progress=0.0
            )
            db.add(enrollment)
            print("✅ Enrolled student in Forward Tipping Dumper course")
        else:
            print("✅ Student already enrolled in Forward Tipping Dumper course")
        
        # 6. Commit all changes
        db.commit()
        
        print("\n🎉 Setup complete!")
        print(f"   Course ID: {ftd_course.id}")
        print(f"   Instructor ID: {instructor.id}")
        print(f"   Student ID: {student.id}")
        print(f"   Student Email: student@example.com")
        print(f"   Student Password: student123")
        
        print("\n📱 Access URLs:")
        print("   Student Portal: http://localhost:3000/student-portal")
        print("   Instructor Dashboard: http://localhost:3000/instructors")
        print("   Learning Interface: http://localhost:3000/learning/2")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    create_ftd_course()
