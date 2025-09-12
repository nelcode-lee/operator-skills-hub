#!/usr/bin/env python3
"""
Script to create test students for the Operator Skills Hub
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserProfile
from app.services.auth import get_password_hash
from app.models.course import Course

def create_test_students():
    """Create test students and enroll them in courses"""
    db = SessionLocal()
    
    try:
        # Check if students already exist
        existing_students = db.query(User).filter(User.role == "student").count()
        if existing_students > 0:
            print(f"Found {existing_students} existing students. Creating additional students...")
            # Don't return, continue with creation
        
        # Get existing courses
        courses = db.query(Course).all()
        if not courses:
            print("No courses found. Please create courses first.")
            return
        
        print(f"Found {len(courses)} courses. Creating students...")
        
        # Create test students
        test_students = [
            {
                "email": "john.doe@example.com",
                "password": "password123",
                "role": "student",
                "cscs_card_number": "CSCS123456",
                "first_name": "John",
                "last_name": "Doe"
            },
            {
                "email": "jane.smith@example.com", 
                "password": "password123",
                "role": "student",
                "cscs_card_number": "CSCS789012",
                "first_name": "Jane",
                "last_name": "Smith"
            },
            {
                "email": "mike.wilson@example.com",
                "password": "password123", 
                "role": "student",
                "cscs_card_number": "CSCS345678",
                "first_name": "Mike",
                "last_name": "Wilson"
            },
            {
                "email": "sarah.jones@example.com",
                "password": "password123",
                "role": "student", 
                "cscs_card_number": "CSCS901234",
                "first_name": "Sarah",
                "last_name": "Jones"
            },
            {
                "email": "david.brown@example.com",
                "password": "password123",
                "role": "student",
                "cscs_card_number": "CSCS567890", 
                "first_name": "David",
                "last_name": "Brown"
            }
        ]
        
        created_students = []
        for student_data in test_students:
            # Check if student already exists
            existing = db.query(User).filter(User.email == student_data["email"]).first()
            if existing:
                print(f"Student {student_data['email']} already exists, skipping...")
                created_students.append(existing)
                continue
                
            # Create new student
            hashed_password = get_password_hash(student_data["password"])
            student = User(
                email=student_data["email"],
                hashed_password=hashed_password,
                role=student_data["role"],
                cscs_card_number=student_data["cscs_card_number"],
                is_active=True
            )
            
            db.add(student)
            db.flush()  # Get the student ID
            
            # Create user profile
            profile = UserProfile(
                user_id=student.id,
                first_name=student_data["first_name"],
                last_name=student_data["last_name"]
            )
            
            db.add(profile)
            created_students.append(student)
            print(f"Created student: {student_data['email']}")
        
        db.commit()
        print(f"\nSuccessfully created {len(created_students)} test students!")
        
        # Print student details
        print("\nTest Students Created:")
        print("=" * 50)
        for student in created_students:
            # Get the profile to show name
            profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
            name = f"{profile.first_name} {profile.last_name}" if profile else "No profile"
            print(f"Email: {student.email}")
            print(f"Name: {name}")
            print(f"CSCS Card: {student.cscs_card_number}")
            print(f"Password: password123")
            print("-" * 30)
            
        print(f"\nYou can now test the manage button with these students!")
        print("Login credentials for testing:")
        print("instructor@example.com / password123 (for instructor dashboard)")
        print("Any of the student emails above with password123 (for student login)")
        
    except Exception as e:
        print(f"Error creating students: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_students()
