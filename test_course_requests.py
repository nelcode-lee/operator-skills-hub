#!/usr/bin/env python3
"""
Test course requests API functionality
"""

import requests
import json

def test_course_requests():
    base_url = "http://localhost:8000"
    
    # Test 1: Check if course requests endpoint exists
    print("Testing course requests API...")
    
    try:
        response = requests.get(f"{base_url}/api/course-requests/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Check API docs
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"Docs status: {response.status_code}")
    except Exception as e:
        print(f"Docs error: {e}")

if __name__ == "__main__":
    test_course_requests()
