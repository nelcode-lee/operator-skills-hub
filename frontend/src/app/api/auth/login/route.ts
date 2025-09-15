import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Demo users with pre-hashed passwords
const DEMO_USERS = [
  {
    email: 'admin@example.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8', // admin123
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'student@example.com', 
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8', // student123
    role: 'student',
    name: 'Student User'
  },
  {
    email: 'instructor@example.com',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.8.8.8', // instructor123
    role: 'instructor', 
    name: 'Instructor User'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = DEMO_USERS.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { detail: 'Incorrect email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { detail: 'Incorrect email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        email: user.email,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
