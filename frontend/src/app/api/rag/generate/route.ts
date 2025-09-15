import { NextRequest, NextResponse } from 'next/server';
import { RAGContentGenerationRequest, RAGContentGenerationResponse } from '@/lib/rag';
import { AIService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body: RAGContentGenerationRequest = await request.json();
    const { query, course_id, content_type, use_context, additional_instructions } = body;

    if (!query || !content_type) {
      return NextResponse.json(
        { success: false, error: 'Query and content_type are required' },
        { status: 400 }
      );
    }

    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    let context = '';
    let sources: any[] = [];

    if (use_context) {
      // Search for relevant content using RAG
      const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          course_id,
          top_k: 5
        })
      });

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.success && searchResult.results) {
          sources = searchResult.results;
          context = sources.map(source => 
            `Source: ${source.metadata.title}\n${source.content}\n`
          ).join('\n');
        }
      }
    }

    // Generate content using AI with or without context
    const aiRequest = {
      content_type: content_type as any,
      title: `Generated ${content_type} for: ${query}`,
      description: query,
      additional_instructions: additional_instructions || (context ? 'Use the provided context from uploaded documents to create relevant content.' : ''),
      course_context: context
    };

    const aiResponse = await AIService.generateContent(aiRequest);

    if (!aiResponse.success) {
      return NextResponse.json(
        { success: false, error: aiResponse.error || 'Content generation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: {
        title: aiResponse.content!.title,
        content: aiResponse.content!.content,
        type: aiResponse.content!.type,
        sources: sources,
        metadata: {
          ...aiResponse.content!.metadata,
          sources_used: sources.length
        }
      }
    });

  } catch (error) {
    console.error('RAG content generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
