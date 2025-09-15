import { NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';

export async function GET() {
  try {
    const isConfigured = AIService.isConfigured();
    
    return NextResponse.json({
      status: isConfigured ? 'configured' : 'not_configured',
      message: isConfigured 
        ? 'AI services are ready' 
        : 'AI services require OpenAI API key configuration',
      openai_configured: isConfigured,
      features: {
        content_generation: true,
        knowledge_tests: true,
        content_analysis: true,
        pdf_processing: true
      }
    });

  } catch (error) {
    console.error('AI status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
