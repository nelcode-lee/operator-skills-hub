import { NextRequest, NextResponse } from 'next/server';
import { AIService, KnowledgeTestRequest } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const body: KnowledgeTestRequest = await request.json();

    // Validate required fields
    if (!body.content || !body.question_count) {
      return NextResponse.json(
        { error: 'content and question_count are required' },
        { status: 400 }
      );
    }

    // Generate knowledge test using AI service
    const result = await AIService.generateKnowledgeTest(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Test generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge test generated successfully',
      data: result.test
    });

  } catch (error) {
    console.error('AI test generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
