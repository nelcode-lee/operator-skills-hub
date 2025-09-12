#!/usr/bin/env python3
"""
Test database connection for Neon DB
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import test_connection, engine
from app.core.config import settings

def test_neon_connection():
    """Test Neon DB connection"""
    print("🔌 Testing Neon DB Connection")
    print("=" * 50)
    
    print(f"Database URL: {settings.database_url}")
    print(f"Using NullPool: {engine.pool.__class__.__name__}")
    
    try:
        # Test basic connection
        if test_connection():
            print("✅ Database connection successful!")
            
            # Test a simple query
            from sqlalchemy import text
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version();"))
                version = result.fetchone()[0]
                print(f"✅ PostgreSQL version: {version}")
                
                # Test database name
                result = conn.execute(text("SELECT current_database();"))
                db_name = result.fetchone()[0]
                print(f"✅ Connected to database: {db_name}")
                
                # Test user
                result = conn.execute(text("SELECT current_user;"))
                user = result.fetchone()[0]
                print(f"✅ Connected as user: {user}")
            
            return True
        else:
            print("❌ Database connection failed")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Neon DB Connection Test")
    print("=" * 60)
    
    success = test_neon_connection()
    
    if success:
        print("\n🎉 Database connection is working correctly!")
        print("\nNext steps:")
        print("1. Run: python3 setup_neon_db.py")
        print("2. Start your application")
    else:
        print("\n❌ Database connection failed!")
        print("\nTroubleshooting:")
        print("1. Check your DATABASE_URL in .env file")
        print("2. Verify your Neon DB credentials")
        print("3. Ensure your Neon DB is active")
        print("4. Check your internet connection")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
