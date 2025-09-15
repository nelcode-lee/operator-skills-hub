#!/usr/bin/env python3
"""
Simple authentication test
"""

import requests
import json

def test_auth():
    """Test authentication endpoints"""
    base_url = 'http://localhost:8000'
    
    print("🔐 Testing Authentication")
    print("=" * 40)
    
    # Test 1: Check if auth endpoints exist
    print("1. Testing auth endpoints...")
    try:
        response = requests.get(f'{base_url}/api/auth/')
        print(f"   Auth root: {response.status_code}")
    except Exception as e:
        print(f"   Auth root error: {e}")
    
    # Test 2: Test token endpoint
    print("\n2. Testing token endpoint...")
    try:
        # Test with form data (OAuth2PasswordRequestForm)
        form_data = {
            "username": "instructor@example.com",
            "password": "password123"
        }
        
        response = requests.post(f'{base_url}/api/auth/token', data=form_data)
        print(f"   Token endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"   Response: {response.text[:200]}...")
        else:
            print(f"   Success: {response.json()}")
            
    except Exception as e:
        print(f"   Token error: {e}")
    
    # Test 3: Test register endpoint
    print("\n3. Testing register endpoint...")
    try:
        register_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "role": "instructor"
        }
        
        response = requests.post(f'{base_url}/api/auth/register', json=register_data)
        print(f"   Register endpoint: {response.status_code}")
        if response.status_code != 200:
            print(f"   Response: {response.text[:200]}...")
        else:
            print(f"   Success: {response.json()}")
            
    except Exception as e:
        print(f"   Register error: {e}")
    
    print("\n" + "=" * 40)
    print("🎉 Authentication test completed!")

if __name__ == "__main__":
    test_auth()














