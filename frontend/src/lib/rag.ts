/**
 * RAG (Retrieval-Augmented Generation) Service for Course Content
 * Simplified version that works with Next.js API routes
 */

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    document_id: string;
    course_id: string;
    title: string;
    source: string;
    created_at: string;
  };
  score?: number;
}

export interface RAGSearchRequest {
  query: string;
  course_id?: string;
  top_k?: number;
  filters?: {
    content_type?: string;
    date_range?: {
      start: string;
      end: string;
    };
  };
}

export interface RAGSearchResponse {
  success: boolean;
  results?: DocumentChunk[];
  total_found?: number;
  error?: string;
}

export interface RAGContentGenerationRequest {
  query: string;
  course_id?: string;
  content_type: 'learning_material' | 'lesson_plan' | 'test' | 'assessment';
  use_context: boolean;
  additional_instructions?: string;
}

export interface RAGContentGenerationResponse {
  success: boolean;
  content?: {
    title: string;
    content: string;
    type: string;
    sources: DocumentChunk[];
    metadata: {
      word_count: number;
      estimated_read_time: number;
      sources_used: number;
    };
  };
  error?: string;
}

export class RAGService {
  private static baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';

  /**
   * Search for relevant content using RAG
   */
  static async searchContent(request: RAGSearchRequest): Promise<RAGSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('RAG search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Generate content using RAG with document context
   */
  static async generateContentWithRAG(request: RAGContentGenerationRequest): Promise<RAGContentGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('RAG content generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed'
      };
    }
  }

  /**
   * Process and index a document for RAG
   */
  static async processDocument(documentId: string, content: string, metadata: any): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          content,
          metadata
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('RAG document processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document processing failed'
      };
    }
  }

  /**
   * Get RAG system status
   */
  static async getStatus(): Promise<{
    success: boolean;
    status?: {
      vector_store_ready: boolean;
      documents_indexed: number;
      last_updated: string;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/rag/status`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('RAG status check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Simple text chunking for local processing
   */
  static chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const words = text.split(' ');
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  /**
   * Simple similarity search using basic text matching
   * This is a fallback when vector search is not available
   */
  static simpleSearch(query: string, documents: DocumentChunk[], topK: number = 5): DocumentChunk[] {
    const queryWords = query.toLowerCase().split(' ');
    
    const scoredDocuments = documents.map(doc => {
      const contentWords = doc.content.toLowerCase().split(' ');
      let score = 0;
      
      // Simple word overlap scoring
      for (const queryWord of queryWords) {
        for (const contentWord of contentWords) {
          if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
            score += 1;
          }
        }
      }
      
      return {
        ...doc,
        score: score / queryWords.length // Normalize by query length
      };
    });
    
    // Sort by score and return top K
    return scoredDocuments
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  }
}
