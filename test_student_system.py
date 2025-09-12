#!/usr/bin/env python3
"""
Test script for the Student Learning System
Tests the complete student portal functionality
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_health():
    """Test backend health"""
    print("🔍 Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_frontend():
    """Test frontend accessibility"""
    print("🔍 Testing frontend accessibility...")
    try:
        response = requests.get(f"{FRONTEND_URL}/student-portal")
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend accessibility failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend accessibility failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints structure"""
    print("🔍 Testing API endpoints...")
    
    endpoints = [
        "/api/learning/available-courses",
        "/api/learning/categories", 
        "/api/learning/difficulty-levels",
        "/api/learning/analytics",
        "/api/learning/assessments/1/info",
        "/api/learning/my-assessments"
    ]
    
    all_good = True
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 401:  # Expected for unauthenticated requests
                print(f"✅ {endpoint} - Authentication required (expected)")
            elif response.status_code == 200:
                print(f"✅ {endpoint} - Accessible")
            else:
                print(f"⚠️  {endpoint} - Status: {response.status_code}")
                all_good = False
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
            all_good = False
    
    return all_good

def test_database_models():
    """Test database model creation"""
    print("🔍 Testing database models...")
    try:
        # Test if we can import the models
        import sys
        sys.path.append('/Users/admin/OperatorSkillsHub/backend')
        
        from app.models.learning import Assessment, AssessmentQuestion, AssessmentAttempt
        from app.models.course import Course
        from app.models.user import User
        
        print("✅ Database models imported successfully")
        return True
    except Exception as e:
        print(f"❌ Database model import failed: {e}")
        return False

def test_frontend_pages():
    """Test frontend pages"""
    print("🔍 Testing frontend pages...")
    
    pages = [
        "/student-portal",
        "/student-catalog", 
        "/login",
        "/"
    ]
    
    all_good = True
    for page in pages:
        try:
            response = requests.get(f"{FRONTEND_URL}{page}")
            if response.status_code == 200:
                print(f"✅ {page} - Loading")
            else:
                print(f"⚠️  {page} - Status: {response.status_code}")
                all_good = False
        except Exception as e:
            print(f"❌ {page} - Error: {e}")
            all_good = False
    
    return all_good

def main():
    """Run all tests"""
    print("🧪 Testing Student Learning System")
    print("=" * 50)
    
    tests = [
        test_health,
        test_frontend,
        test_database_models,
        test_api_endpoints,
        test_frontend_pages
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Student Learning System is ready.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
