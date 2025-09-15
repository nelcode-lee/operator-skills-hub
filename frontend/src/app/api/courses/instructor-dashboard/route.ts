import { NextRequest, NextResponse } from 'next/server';

// Mock course data for instructor dashboard
const MOCK_INSTRUCTOR_COURSES = [
  {
    id: 1,
    title: "Forward Tipping Dumper",
    description: "Comprehensive training course for forward tipping dumper operation",
    instructor_id: 1,
    student_count: 15,
    content_count: 8,
    created_at: "2024-01-15T10:00:00Z"
  },
  {
    id: 2,
    title: "CSCS Health & Safety Awareness",
    description: "Essential health and safety training for construction workers",
    instructor_id: 1,
    student_count: 25,
    content_count: 12,
    created_at: "2024-01-20T10:00:00Z"
  },
  {
    id: 3,
    title: "Environmental Compliance",
    description: "Environmental regulations and compliance training",
    instructor_id: 1,
    student_count: 18,
    content_count: 6,
    created_at: "2024-02-01T10:00:00Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    // Return mock instructor courses
    return NextResponse.json(MOCK_INSTRUCTOR_COURSES);
  } catch (error) {
    console.error('Instructor dashboard API error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
