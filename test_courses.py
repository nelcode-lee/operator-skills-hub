#!/usr/bin/env python3
"""
Test script to verify course creation and publishing
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_courses_api():
    """Test the courses API endpoints"""
    
    print("🔍 Testing Courses API...")
    
    # Test 1: Get all courses (should be empty initially)
    print("\n1. Testing GET /api/courses/ (public courses)")
    try:
        response = requests.get(f"{BASE_URL}/api/courses/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            courses = response.json()
            print(f"   Found {len(courses)} published courses")
            for course in courses:
                print(f"   - {course['title']} (Status: {course.get('status', 'unknown')})")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Check if we can create a test course (this would require authentication)
    print("\n2. Testing course creation (requires authentication)")
    print("   Note: This requires a valid instructor token")
    
    # Test 3: Check the database directly
    print("\n3. Database check")
    print("   You can check the database with:")
    print("   - psql -h localhost -U postgres -d operator_skills_hub")
    print("   - SELECT id, title, status, is_active FROM courses;")
    
    print("\n✅ Course API test completed!")
    print("\n📋 Next steps:")
    print("1. Start the backend server: cd backend && python -m uvicorn app.main:app --reload")
    print("2. Start the frontend: cd frontend && npm run dev")
    print("3. Go to the instructor dashboard and create/publish a course")
    print("4. Check the courses page to see if it appears")

if __name__ == "__main__":
    test_courses_api()
