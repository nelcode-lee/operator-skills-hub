#!/usr/bin/env python3
"""
Test PDF upload functionality
"""

import requests
import json
import os
from pathlib import Path

def test_upload():
    """Test the PDF upload endpoint"""
    base_url = 'http://localhost:8000'
    
    print("🧪 Testing PDF Upload Functionality")
    print("=" * 50)
    
    # Test 1: Check if API is running
    print("1. Testing API connectivity...")
    try:
        response = requests.get(f'{base_url}/')
        if response.status_code == 200:
            print("✅ API is running")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ API not responding: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        return
    
    # Test 2: Check instructor AI endpoints
    print("\n2. Testing instructor AI endpoints...")
    try:
        response = requests.get(f'{base_url}/api/instructor-ai/course-documents?course_id=1')
        if response.status_code == 401:
            print("✅ Instructor AI endpoints are accessible (authentication required)")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing endpoints: {e}")
    
    # Test 3: Check API documentation
    print("\n3. Testing API documentation...")
    try:
        response = requests.get(f'{base_url}/docs')
        if response.status_code == 200:
            print("✅ API documentation accessible")
        else:
            print(f"❌ Documentation not accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ Error accessing docs: {e}")
    
    # Test 4: Create a test PDF file
    print("\n4. Creating test PDF file...")
    try:
        test_pdf_path = Path("test_upload.pdf")
        with open(test_pdf_path, "wb") as f:
            # Create a minimal PDF content
            f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF")
        print(f"✅ Test PDF created: {test_pdf_path}")
    except Exception as e:
        print(f"❌ Error creating test PDF: {e}")
        return
    
    # Test 5: Test upload endpoint (without authentication)
    print("\n5. Testing upload endpoint (without auth)...")
    try:
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_upload.pdf", f, "application/pdf")}
            data = {
                "course_id": 1,
                "title": "Test PDF Upload",
                "description": "Test document for upload functionality"
            }
            response = requests.post(f'{base_url}/api/instructor-ai/upload-document', files=files, data=data)
            
        if response.status_code == 401:
            print("✅ Upload endpoint is accessible (authentication required)")
            print("   This is expected - you need to be logged in as an instructor")
        elif response.status_code == 403:
            print("✅ Upload endpoint is accessible (instructor role required)")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error testing upload: {e}")
    
    # Cleanup
    print("\n6. Cleaning up...")
    try:
        if test_pdf_path.exists():
            test_pdf_path.unlink()
            print("✅ Test file cleaned up")
    except Exception as e:
        print(f"⚠️  Error cleaning up: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Upload functionality test completed!")
    print("\nNext steps:")
    print("1. Make sure you're logged in as an instructor")
    print("2. Try uploading a PDF through the frontend")
    print("3. Check the browser's network tab for the actual request URL")

if __name__ == "__main__":
    test_upload()





