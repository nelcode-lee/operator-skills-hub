#!/usr/bin/env python3
"""
Seed demo data for Operator Skills Hub
Creates comprehensive course data for both student and instructor areas
"""

import os
import sys
import psycopg2
import bcrypt
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

load_dotenv()

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(os.getenv('DATABASE_URL'))

def hash_password(password):
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_demo_data():
    """Seed comprehensive demo data"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("🌱 Seeding demo data for Operator Skills Hub...")
        
        # 1. Ensure demo users exist with correct passwords
        print("\n📝 Setting up demo users...")
        demo_users = [
            {
                'email': 'instructor@example.com',
                'role': 'instructor',
                'hashed_password': hash_password('password123'),
                'is_active': True,
                'is_verified': True
            },
            {
                'email': 'student@example.com',
                'role': 'student',
                'hashed_password': hash_password('password123'),
                'is_active': True,
                'is_verified': True
            },
            {
                'email': 'admin@example.com',
                'role': 'admin',
                'hashed_password': hash_password('password123'),
                'is_active': True,
                'is_verified': True
            }
        ]
        
        for user in demo_users:
            # Check if user exists
            cur.execute('SELECT id FROM users WHERE email = %s', (user['email'],))
            existing_user = cur.fetchone()
            
            if existing_user:
                # Update existing user
                cur.execute('''
                    UPDATE users 
                    SET hashed_password = %s, is_active = %s, is_verified = %s
                    WHERE email = %s
                ''', (user['hashed_password'], user['is_active'], user['is_verified'], user['email']))
                print(f"  ✅ Updated {user['email']}")
            else:
                # Create new user
                cur.execute('''
                    INSERT INTO users (email, hashed_password, role, is_active, is_verified, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (user['email'], user['hashed_password'], user['role'], 
                     user['is_active'], user['is_verified'], datetime.now()))
                print(f"  ✅ Created {user['email']}")
        
        # 2. Get instructor ID
        cur.execute('SELECT id FROM users WHERE email = %s', ('instructor@example.com',))
        instructor_id = cur.fetchone()[0]
        
        # 3. Create comprehensive course catalog
        print("\n📚 Creating comprehensive course catalog...")
        
        courses_data = [
            {
                'title': 'Forward Tipping Dumper Operations',
                'description': 'Comprehensive training course covering forward tipping dumper operation, safety procedures, and maintenance. Includes both theory and practical assessments.',
                'category': 'Plant Operations',
                'difficulty_level': 'intermediate',
                'duration_hours': 16.0,
                'price': 450.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['CSCS Card', 'Basic Construction Experience'],
                'learning_objectives': [
                    'Understand dumper operation principles',
                    'Perform pre-use inspections',
                    'Execute safe loading and tipping procedures',
                    'Complete maintenance tasks'
                ]
            },
            {
                'title': 'CSCS Health & Safety Awareness',
                'description': 'Essential health and safety training for construction workers. Covers current legislation, risk assessment, and safe working practices.',
                'category': 'Health & Safety',
                'difficulty_level': 'beginner',
                'duration_hours': 8.0,
                'price': 200.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': [],
                'learning_objectives': [
                    'Understand health and safety legislation',
                    'Identify workplace hazards',
                    'Use PPE correctly',
                    'Complete risk assessments'
                ]
            },
            {
                'title': 'Excavator Operations - Advanced',
                'description': 'Advanced excavator training for experienced operators. Covers complex operations, precision work, and advanced safety procedures.',
                'category': 'Plant Operations',
                'difficulty_level': 'advanced',
                'duration_hours': 24.0,
                'price': 650.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['Basic Excavator Experience', 'CSCS Card'],
                'learning_objectives': [
                    'Master advanced excavator techniques',
                    'Perform precision operations',
                    'Understand load charts and limitations',
                    'Execute complex excavation tasks'
                ]
            },
            {
                'title': 'GPS Machine Control Training',
                'description': 'Training on GPS machine control systems for excavators, dozers, and graders. Covers system setup, operation, and troubleshooting.',
                'category': 'Technology',
                'difficulty_level': 'intermediate',
                'duration_hours': 20.0,
                'price': 550.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['Plant Operator Experience'],
                'learning_objectives': [
                    'Understand GPS machine control principles',
                    'Set up and calibrate systems',
                    'Operate machines with GPS guidance',
                    'Troubleshoot common issues'
                ]
            },
            {
                'title': 'Utility Detection & Safe Digging',
                'description': 'Comprehensive training on utility detection techniques, safe digging practices, and CAT and Genny operation.',
                'category': 'Utility Operations',
                'difficulty_level': 'intermediate',
                'duration_hours': 12.0,
                'price': 350.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['CSCS Card'],
                'learning_objectives': [
                    'Operate detection equipment',
                    'Interpret detection results',
                    'Plan safe excavation work',
                    'Follow HSG47 guidelines'
                ]
            },
            {
                'title': 'NRSWA Street Works Training',
                'description': 'New Roads and Street Works Act training for operatives and supervisors. Covers legislation, procedures, and practical applications.',
                'category': 'Street Works',
                'difficulty_level': 'intermediate',
                'duration_hours': 14.0,
                'price': 400.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['CSCS Card'],
                'learning_objectives': [
                    'Understand NRSWA legislation',
                    'Plan street works safely',
                    'Execute proper signing and guarding',
                    'Complete required documentation'
                ]
            },
            {
                'title': 'Site Safety Plus (SSP)',
                'description': 'Advanced health and safety training for supervisors and managers. Covers leadership, risk management, and legal responsibilities.',
                'category': 'Management',
                'difficulty_level': 'advanced',
                'duration_hours': 18.0,
                'price': 500.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['CSCS Card', 'Supervisory Experience'],
                'learning_objectives': [
                    'Lead health and safety on site',
                    'Manage risk effectively',
                    'Train and supervise teams',
                    'Ensure legal compliance'
                ]
            },
            {
                'title': 'CPCS Theory Test Preparation',
                'description': 'Comprehensive preparation for CPCS theory tests across multiple categories. Includes practice tests and revision materials.',
                'category': 'Assessment Preparation',
                'difficulty_level': 'intermediate',
                'duration_hours': 10.0,
                'price': 250.0,
                'status': 'published',
                'is_active': True,
                'prerequisites': ['Basic Construction Knowledge'],
                'learning_objectives': [
                    'Understand CPCS test format',
                    'Master theory content',
                    'Practice test techniques',
                    'Achieve pass standard'
                ]
            }
        ]
        
        for course_data in courses_data:
            # Check if course exists
            cur.execute('SELECT id FROM courses WHERE title = %s', (course_data['title'],))
            existing_course = cur.fetchone()
            
            if existing_course:
                print(f"  ✅ Course '{course_data['title']}' already exists")
            else:
                # Create new course
                cur.execute('''
                    INSERT INTO courses (
                        title, description, category, difficulty_level, duration_hours,
                        price, status, is_active, instructor_id, prerequisites,
                        learning_objectives, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    course_data['title'], course_data['description'], course_data['category'],
                    course_data['difficulty_level'], course_data['duration_hours'],
                    course_data['price'], course_data['status'], course_data['is_active'],
                    instructor_id, json.dumps(course_data['prerequisites']), 
                    json.dumps(course_data['learning_objectives']), datetime.now()
                ))
                course_id = cur.fetchone()[0]
                print(f"  ✅ Created course: {course_data['title']} (ID: {course_id})")
        
        # 4. Create course modules and content
        print("\n📖 Creating course modules and content...")
        
        # Get all courses
        cur.execute('SELECT id, title FROM courses WHERE is_active = true')
        courses = cur.fetchall()
        
        for course_id, course_title in courses:
            # Create main module
            cur.execute('''
                INSERT INTO course_modules (course_id, title, description, "order", content_type, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (course_id, f'{course_title} - Main Module', 'Main learning module', 1, 'mixed', datetime.now()))
            module_id = cur.fetchone()[0]
            
            # Create course content
            content_items = [
                {
                    'title': 'Course Introduction',
                    'content': f'Welcome to {course_title}. This module covers the essential knowledge and skills required.',
                    'content_type': 'text',
                    'order': 1
                },
                {
                    'title': 'Safety Procedures',
                    'content': 'Critical safety information and procedures that must be followed at all times.',
                    'content_type': 'text',
                    'order': 2
                },
                {
                    'title': 'Practical Assessment',
                    'content': 'Hands-on assessment to demonstrate your understanding and skills.',
                    'content_type': 'interactive',
                    'order': 3
                },
                {
                    'title': 'Final Assessment',
                    'content': 'Comprehensive test covering all course material.',
                    'content_type': 'test',
                    'order': 4
                }
            ]
            
            for content in content_items:
                cur.execute('''
                    INSERT INTO course_content (
                        module_id, title, content, content_type, "order", is_ai_generated, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (module_id, content['title'], content['content'], 
                     content['content_type'], content['order'], False, datetime.now()))
        
        # 5. Create some enrollments for demo student
        print("\n👥 Creating student enrollments...")
        
        cur.execute('SELECT id FROM users WHERE email = %s', ('student@example.com',))
        student_id = cur.fetchone()[0]
        
        # Get some course IDs to enroll student in
        cur.execute('SELECT id FROM courses WHERE is_active = true LIMIT 4')
        course_ids = [row[0] for row in cur.fetchall()]
        
        for course_id in course_ids:
            # Check if already enrolled
            cur.execute('SELECT id FROM enrollments WHERE user_id = %s AND course_id = %s', 
                       (student_id, course_id))
            if not cur.fetchone():
                cur.execute('''
                    INSERT INTO enrollments (user_id, course_id, enrolled_at, status)
                    VALUES (%s, %s, %s, %s)
                ''', (student_id, course_id, datetime.now(), 'active'))
                print(f"  ✅ Enrolled student in course {course_id}")
        
        # 6. Create some course requests for demo
        print("\n📋 Creating course requests...")
        
        # Get courses student is not enrolled in
        cur.execute('''
            SELECT c.id, c.title FROM courses c 
            WHERE c.is_active = true 
            AND c.id NOT IN (
                SELECT course_id FROM enrollments WHERE user_id = %s
            )
            LIMIT 2
        ''', (student_id,))
        available_courses = cur.fetchall()
        
        for course_id, course_title in available_courses:
            cur.execute('''
                INSERT INTO course_requests (
                    student_id, course_id, status, message, created_at
                ) VALUES (%s, %s, %s, %s, %s)
            ''', (student_id, course_id, 'pending', 
                 f'Requesting access to {course_title} for professional development', datetime.now()))
            print(f"  ✅ Created course request for {course_title}")
        
        # 7. Create learning sessions for demo
        print("\n📊 Creating learning sessions...")
        
        # Get student's enrollments
        cur.execute('SELECT course_id FROM enrollments WHERE user_id = %s', (student_id,))
        enrolled_courses = [row[0] for row in cur.fetchall()]
        
        for course_id in enrolled_courses[:2]:  # Create sessions for first 2 courses
            # Get course content
            cur.execute('''
                SELECT cc.id FROM course_content cc
                JOIN course_modules cm ON cc.module_id = cm.id
                WHERE cm.course_id = %s
                LIMIT 2
            ''', (course_id,))
            content_ids = [row[0] for row in cur.fetchall()]
            
            for content_id in content_ids:
                session_start = datetime.now() - timedelta(days=2)
                session_end = session_start + timedelta(minutes=30)
                
                # Get enrollment ID
                cur.execute('SELECT id FROM enrollments WHERE user_id = %s AND course_id = %s', 
                           (student_id, course_id))
                enrollment_id = cur.fetchone()[0]
                
                cur.execute('''
                    INSERT INTO learning_sessions (
                        user_id, course_id, enrollment_id, started_at, ended_at, 
                        duration_minutes
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    student_id, course_id, enrollment_id, session_start, session_end, 30
                ))
        
        print("  ✅ Created learning sessions")
        
        # Commit all changes
        conn.commit()
        print("\n🎉 Demo data seeding completed successfully!")
        print("\n📋 Summary:")
        print(f"  • Demo users configured with password 'password123'")
        print(f"  • {len(courses_data)} courses created")
        print(f"  • Student enrollments and course requests created")
        print(f"  • Learning sessions and progress data added")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed_demo_data()
