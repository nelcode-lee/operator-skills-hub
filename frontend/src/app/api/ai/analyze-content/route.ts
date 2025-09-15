import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    // Analyze content using AI service
    const result = await AIService.analyzeContent(content);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Content analysis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content analyzed successfully',
      data: result.analysis
    });

  } catch (error) {
    console.error('AI content analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
