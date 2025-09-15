import { NextRequest, NextResponse } from 'next/server';
import { RAGSearchRequest, RAGSearchResponse } from '@/lib/rag';

// Mock document storage (in production, this would be a vector database)
const mockDocuments = [
  {
    id: 'doc_1_chunk_1',
    content: 'Safety procedures are essential in construction work. Always wear appropriate personal protective equipment (PPE) including hard hats, safety boots, and high-visibility clothing.',
    metadata: {
      document_id: 'doc_1',
      course_id: '1',
      title: 'Forward Tipping Dumper Safety',
      source: 'FTD Safety Manual',
      created_at: '2024-01-15T10:00:00Z'
    }
  },
  {
    id: 'doc_1_chunk_2',
    content: 'Before operating any machinery, conduct a thorough pre-use inspection. Check for visible damage, ensure all safety systems are functioning, and verify that all controls are working properly.',
    metadata: {
      document_id: 'doc_1',
      course_id: '1',
      title: 'Forward Tipping Dumper Safety',
      source: 'FTD Safety Manual',
      created_at: '2024-01-15T10:00:00Z'
    }
  },
  {
    id: 'doc_2_chunk_1',
    content: 'Environmental compliance is crucial for construction projects. Ensure all activities comply with local environmental regulations and best practices.',
    metadata: {
      document_id: 'doc_2',
      course_id: '2',
      title: 'Environmental Compliance',
      source: 'Environmental Guidelines',
      created_at: '2024-01-20T10:00:00Z'
    }
  },
  {
    id: 'doc_3_chunk_1',
    content: 'Quality control measures help ensure that construction work meets required standards. Regular inspections and testing are essential components of quality management.',
    metadata: {
      document_id: 'doc_3',
      course_id: '1',
      title: 'Quality Control',
      source: 'Quality Standards',
      created_at: '2024-01-25T10:00:00Z'
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const body: RAGSearchRequest = await request.json();
    const { query, course_id, top_k = 5, filters } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Filter documents by course_id if specified
    let filteredDocs = mockDocuments;
    if (course_id) {
      filteredDocs = mockDocuments.filter(doc => doc.metadata.course_id === course_id);
    }

    // Apply additional filters
    if (filters?.content_type) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.metadata.title.toLowerCase().includes(filters.content_type!.toLowerCase())
      );
    }

    // Simple text-based search (in production, this would use vector similarity)
    const queryWords = query.toLowerCase().split(' ');
    const scoredDocs = filteredDocs.map(doc => {
      const contentWords = doc.content.toLowerCase().split(' ');
      let score = 0;
      
      // Calculate simple word overlap score
      for (const queryWord of queryWords) {
        for (const contentWord of contentWords) {
          if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
            score += 1;
          }
        }
      }
      
      return {
        ...doc,
        score: score / queryWords.length
      };
    });

    // Sort by score and return top K results
    const results = scoredDocs
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, top_k)
      .filter(doc => (doc.score || 0) > 0); // Only return documents with some relevance

    return NextResponse.json({
      success: true,
      results,
      total_found: results.length
    });

  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
