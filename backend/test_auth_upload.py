#!/usr/bin/env python3
"""
Test PDF upload with authentication
"""

import requests
import json
import os
from pathlib import Path

def test_authenticated_upload():
    """Test the PDF upload endpoint with authentication"""
    base_url = 'http://localhost:8000'
    
    print("🔐 Testing Authenticated PDF Upload")
    print("=" * 50)
    
    # Step 1: Login as instructor
    print("1. Logging in as instructor...")
    login_data = {
        "username": "instructor@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f'{base_url}/api/auth/token', data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            print("✅ Successfully logged in as instructor")
            print(f"   Token: {access_token[:20]}...")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Create test PDF
    print("\n2. Creating test PDF...")
    test_pdf_path = Path("test_auth_upload.pdf")
    try:
        with open(test_pdf_path, "wb") as f:
            f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF")
        print("✅ Test PDF created")
    except Exception as e:
        print(f"❌ Error creating PDF: {e}")
        return
    
    # Step 3: Test upload with authentication
    print("\n3. Testing upload with authentication...")
    try:
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        with open(test_pdf_path, "rb") as f:
            files = {"file": ("test_auth_upload.pdf", f, "application/pdf")}
            data = {
                "course_id": 1,
                "title": "Test Authenticated Upload",
                "description": "Test document uploaded with authentication"
            }
            
            response = requests.post(
                f'{base_url}/api/instructor-ai/upload-document',
                files=files,
                data=data,
                headers=headers
            )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Upload successful!")
            result = response.json()
            print(f"   File ID: {result.get('file_id')}")
            print(f"   Message: {result.get('message')}")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text[:300]}...")
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
    
    # Step 4: Cleanup
    print("\n4. Cleaning up...")
    try:
        if test_pdf_path.exists():
            test_pdf_path.unlink()
            print("✅ Test file cleaned up")
    except Exception as e:
        print(f"⚠️  Error cleaning up: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Authenticated upload test completed!")

if __name__ == "__main__":
    test_authenticated_upload()
