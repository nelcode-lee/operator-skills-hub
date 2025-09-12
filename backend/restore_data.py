#!/usr/bin/env python3
"""
Script to restore course data and student enrollments
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserProfile
from app.models.course import Course
from app.models.learning import Enrollment
from app.models.course import CourseFileContent
from app.services.auth import get_password_hash
from datetime import datetime

def restore_data():
    """Restore course data and create sample enrollments"""
    db = SessionLocal()
    
    try:
        print("🔍 Checking current data...")
        
        # Get existing data
        courses = db.query(Course).all()
        students = db.query(User).filter(User.role == "student").all()
        enrollments = db.query(Enrollment).all()
        content = db.query(CourseFileContent).all()
        
        print(f"Found {len(courses)} courses, {len(students)} students, {len(enrollments)} enrollments, {len(content)} content items")
        
        # Create sample enrollments
        print("\n📚 Creating sample enrollments...")
        
        # Get some courses to enroll students in
        if courses:
            course1 = courses[0]  # First course
            course2 = courses[1] if len(courses) > 1 else courses[0]  # Second course or same as first
            
            enrollment_count = 0
            for i, student in enumerate(students):
                # Enroll students in different courses
                target_course = course1 if i % 2 == 0 else course2
                
                # Check if already enrolled
                existing = db.query(Enrollment).filter(
                    Enrollment.user_id == student.id,
                    Enrollment.course_id == target_course.id
                ).first()
                
                if not existing:
                    enrollment = Enrollment(
                        user_id=student.id,
                        course_id=target_course.id,
                        status="active",
                        progress=0.0
                    )
                    db.add(enrollment)
                    enrollment_count += 1
                    print(f"  ✅ Enrolled {student.email} in {target_course.title}")
                else:
                    print(f"  ⏭️  {student.email} already enrolled in {target_course.title}")
            
            db.commit()
            print(f"\n🎉 Created {enrollment_count} new enrollments!")
        
        # Create some sample course content if we don't have enough
        print("\n📄 Checking course content...")
        
        if len(content) < 5:  # If we have less than 5 content items, create some
            print("Creating sample course content...")
            
            # Get courses that need content
            courses_needing_content = []
            for course in courses[:3]:  # First 3 courses
                course_content_count = db.query(CourseFileContent).filter(
                    CourseFileContent.course_id == course.id
                ).count()
                if course_content_count == 0:
                    courses_needing_content.append(course)
            
            # Create sample content
            sample_content = [
                {
                    "title": "Introduction to Safety",
                    "description": "Basic safety principles and procedures",
                    "content_type": "pdf",
                    "page_count": 25,
                    "file_size": 1024000
                },
                {
                    "title": "Equipment Operation",
                    "description": "How to safely operate construction equipment",
                    "content_type": "pdf", 
                    "page_count": 30,
                    "file_size": 1536000
                },
                {
                    "title": "Risk Assessment",
                    "description": "Identifying and managing workplace risks",
                    "content_type": "pdf",
                    "page_count": 20,
                    "file_size": 896000
                }
            ]
            
            content_created = 0
            for i, course in enumerate(courses_needing_content):
                if i < len(sample_content):
                    content_data = sample_content[i]
                    
                    # Check if content already exists
                    existing = db.query(CourseFileContent).filter(
                        CourseFileContent.course_id == course.id,
                        CourseFileContent.title == content_data["title"]
                    ).first()
                    
                    if not existing:
                        content_item = CourseFileContent(
                            course_id=course.id,
                            instructor_id=course.instructor_id,
                            title=content_data["title"],
                            description=content_data["description"],
                            content_type=content_data["content_type"],
                            page_count=content_data["page_count"],
                            file_size=content_data["file_size"],
                            is_active=True,
                            file_metadata={"restored": True, "created_at": datetime.now().isoformat()}
                        )
                        db.add(content_item)
                        content_created += 1
                        print(f"  ✅ Created content '{content_data['title']}' for {course.title}")
            
            db.commit()
            print(f"\n🎉 Created {content_created} new content items!")
        
        # Final status check
        print("\n📊 Final data status:")
        final_courses = db.query(Course).count()
        final_students = db.query(User).filter(User.role == "student").count()
        final_enrollments = db.query(Enrollment).count()
        final_content = db.query(CourseFileContent).count()
        
        print(f"  📚 Courses: {final_courses}")
        print(f"  👥 Students: {final_students}")
        print(f"  🔗 Enrollments: {final_enrollments}")
        print(f"  📄 Content items: {final_content}")
        
        # Show enrollment details
        print("\n👥 Enrollment details:")
        enrollments = db.query(Enrollment).all()
        for enrollment in enrollments:
            student = db.query(User).filter(User.id == enrollment.user_id).first()
            course = db.query(Course).filter(Course.id == enrollment.course_id).first()
            if student and course:
                print(f"  - {student.email} → {course.title} (Progress: {enrollment.progress}%)")
        
        print("\n✅ Data restoration complete!")
        print("\nYou can now test the instructor dashboard with populated data.")
        
    except Exception as e:
        print(f"❌ Error restoring data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    restore_data()


