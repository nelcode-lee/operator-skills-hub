#!/usr/bin/env python3
"""
Neon DB Setup Script for Operator Skills Hub
Configures and tests Neon DB connection
"""

import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import Base, engine

def test_neon_connection():
    """Test Neon DB connection"""
    print("🔌 Testing Neon DB Connection")
    print("=" * 50)
    
    try:
        # Test basic connection
        conn = psycopg2.connect(settings.database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Connected to PostgreSQL: {version}")
        
        # Test database info
        cursor.execute("SELECT current_database();")
        db_name = cursor.fetchone()[0]
        print(f"✅ Database: {db_name}")
        
        # Test user info
        cursor.execute("SELECT current_user;")
        user = cursor.fetchone()[0]
        print(f"✅ User: {user}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def create_neon_tables():
    """Create all tables in Neon DB"""
    print("\n🏗️  Creating Tables in Neon DB")
    print("=" * 50)
    
    try:
        # Import all models to ensure they're registered
        from app.models.user import User
        from app.models.course import Course, CourseContent, CourseFileContent, CourseModule
        from app.models.learning import Enrollment, LearningSession, Assessment, AssessmentAttempt
        from app.models.ai import ContentGeneration, PredictiveScore, InstructorMetric
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully")
        
        # Verify tables exist
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            
            tables = [row[0] for row in result]
            print(f"📊 Tables created: {len(tables)}")
            for table in tables:
                print(f"  ✅ {table}")
        
        return True
        
    except Exception as e:
        print(f"❌ Table creation failed: {e}")
        return False

def setup_neon_indexes():
    """Create optimized indexes for Neon DB"""
    print("\n📊 Setting up Neon DB Indexes")
    print("=" * 50)
    
    indexes = [
        # User indexes
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);",
        "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);",
        
        # Course indexes
        "CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);",
        "CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);",
        "CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);",
        
        # Content indexes
        "CREATE INDEX IF NOT EXISTS idx_course_content_module_id ON course_content(module_id);",
        "CREATE INDEX IF NOT EXISTS idx_course_content_files_course_id ON course_content_files(course_id);",
        "CREATE INDEX IF NOT EXISTS idx_course_content_files_instructor_id ON course_content_files(instructor_id);",
        
        # Learning indexes
        "CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);",
        "CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);",
        "CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);",
        # Progress indexes removed - no progress table exists
        
        # AI indexes
        "CREATE INDEX IF NOT EXISTS idx_content_generations_course_id ON content_generations(course_id);",
        "CREATE INDEX IF NOT EXISTS idx_content_generations_approved ON content_generations(is_approved);",
        "CREATE INDEX IF NOT EXISTS idx_predictive_scores_user_id ON predictive_scores(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_instructor_metrics_instructor_id ON instructor_metrics(instructor_id);",
    ]
    
    try:
        with engine.connect() as conn:
            for index_sql in indexes:
                conn.execute(text(index_sql))
                conn.commit()
        
        print("✅ All indexes created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Index creation failed: {e}")
        return False

def test_neon_performance():
    """Test Neon DB performance"""
    print("\n⚡ Testing Neon DB Performance")
    print("=" * 50)
    
    try:
        import time
        
        with engine.connect() as conn:
            # Test simple query
            start_time = time.time()
            result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"))
            table_count = result.fetchone()[0]
            simple_query_time = time.time() - start_time
            
            print(f"✅ Simple query: {simple_query_time:.3f}s")
            print(f"📊 Tables found: {table_count}")
            
            # Test complex query
            start_time = time.time()
            result = conn.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats 
                WHERE schemaname = 'public'
                LIMIT 10;
            """))
            stats = result.fetchall()
            complex_query_time = time.time() - start_time
            
            print(f"✅ Complex query: {complex_query_time:.3f}s")
            print(f"📊 Statistics rows: {len(stats)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        return False

def create_neon_sample_data():
    """Create sample data for testing"""
    print("\n📝 Creating Sample Data")
    print("=" * 50)
    
    try:
        from app.core.database import get_db
        from app.models.user import User
        from app.models.course import Course
        from app.models.ai import ContentGeneration
        from datetime import datetime
        import hashlib
        
        db = next(get_db())
        
        # Create sample instructor
        instructor = User(
            email="instructor@example.com",
            hashed_password=hashlib.sha256("password123".encode()).hexdigest(),
            role="instructor",
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        db.add(instructor)
        db.commit()
        db.refresh(instructor)
        
        # Create sample course
        course = Course(
            title="Construction Safety Fundamentals",
            description="Comprehensive safety training for construction workers",
            instructor_id=instructor.id,
            status="active",
            created_at=datetime.utcnow()
        )
        
        db.add(course)
        db.commit()
        db.refresh(course)
        
        # Create sample content generation
        content_gen = ContentGeneration(
            prompt="Generate learning material for construction safety",
            generated_content="Sample AI-generated content",
            model_used="gpt-3.5-turbo",
            content_type="learning_material",
            course_id=course.id,
            is_approved=False,
            created_at=datetime.utcnow()
        )
        
        db.add(content_gen)
        db.commit()
        
        print("✅ Sample data created successfully")
        print(f"  👤 Instructor: {instructor.email}")
        print(f"  📚 Course: {course.title}")
        print(f"  🤖 Content Generation: {content_gen.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Sample data creation failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Neon DB Setup for Operator Skills Hub")
    print("=" * 60)
    
    # Test connection
    if not test_neon_connection():
        print("\n❌ Cannot proceed without database connection")
        return False
    
    # Create tables
    if not create_neon_tables():
        print("\n❌ Table creation failed")
        return False
    
    # Setup indexes
    if not setup_neon_indexes():
        print("\n❌ Index setup failed")
        return False
    
    # Test performance
    if not test_neon_performance():
        print("\n❌ Performance test failed")
        return False
    
    # Create sample data
    if not create_neon_sample_data():
        print("\n❌ Sample data creation failed")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 Neon DB setup completed successfully!")
    print("\nYour database is ready for production use with:")
    print("✅ Optimized indexes for performance")
    print("✅ All required tables created")
    print("✅ Sample data for testing")
    print("✅ Performance tested and verified")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
