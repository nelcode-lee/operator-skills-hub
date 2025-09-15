#!/usr/bin/env python3
"""
Simple test script to verify the backend works before Railway deployment.
"""
import sys
import subprocess
import requests
import time
import os

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    try:
        from app.main import app
        print("✅ FastAPI app imported successfully")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_uvicorn():
    """Test that uvicorn can start the app."""
    print("Testing uvicorn startup...")
    try:
        # Start uvicorn in background
        process = subprocess.Popen([
            "uvicorn", "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8001"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a bit for startup
        time.sleep(3)
        
        # Test health endpoint
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print("✅ Uvicorn started successfully")
            process.terminate()
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            process.terminate()
            return False
            
    except Exception as e:
        print(f"❌ Uvicorn test failed: {e}")
        if 'process' in locals():
            process.terminate()
        return False

def main():
    """Run all tests."""
    print("Running Railway deployment tests...")
    
    # Test imports
    if not test_imports():
        sys.exit(1)
    
    # Test uvicorn
    if not test_uvicorn():
        sys.exit(1)
    
    print("✅ All tests passed! Ready for Railway deployment.")

if __name__ == "__main__":
    main()
