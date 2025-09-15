import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    demo_users: [
      {
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User'
      },
      {
        email: 'student@example.com',
        password: 'student123', 
        role: 'student',
        name: 'Student User'
      },
      {
        email: 'instructor@example.com',
        password: 'instructor123',
        role: 'instructor',
        name: 'Instructor User'
      }
    ]
  });
}
