import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Mock student data
const MOCK_STUDENTS = [
  {
    id: 1,
    email: "student1@example.com",
    first_name: "John",
    last_name: "Smith",
    cscs_card_number: "CSCS123456",
    is_active: true,
    last_accessed: "2024-09-15T14:30:00Z"
  },
  {
    id: 2,
    email: "student2@example.com",
    first_name: "Sarah",
    last_name: "Johnson",
    cscs_card_number: "CSCS789012",
    is_active: true,
    last_accessed: "2024-09-14T09:15:00Z"
  },
  {
    id: 3,
    email: "student3@example.com",
    first_name: "Mike",
    last_name: "Brown",
    cscs_card_number: "CSCS345678",
    is_active: false,
    last_accessed: "2024-09-10T16:45:00Z"
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const courseId = params.id;
    
    // Return mock students for the course
    return NextResponse.json({
      students: MOCK_STUDENTS,
      course_id: courseId
    });
  } catch (error) {
    console.error('Course students API error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
