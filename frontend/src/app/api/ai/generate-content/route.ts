import { NextRequest, NextResponse } from 'next/server';
import { AIService, ContentGenerationRequest } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const body: ContentGenerationRequest = await request.json();

    // Validate required fields
    if (!body.content_type || !body.title) {
      return NextResponse.json(
        { error: 'content_type and title are required' },
        { status: 400 }
      );
    }

    // Generate content using AI service
    const result = await AIService.generateContent(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Content generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content generated successfully',
      data: result.content
    });

  } catch (error) {
    console.error('AI content generation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
