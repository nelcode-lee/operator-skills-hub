# Course Content System with RAG Integration

## Overview

The Course Content System combines RAG (Retrieval-Augmented Generation) with uploaded documents to enable instructors to build comprehensive courses using AI. This system allows instructors to upload documents, process them for AI context, and generate educational content that's tailored to their specific materials.

## Key Features

### 🎯 RAG-Powered Content Generation
- **Document Processing**: Upload PDFs and other documents that are automatically processed and embedded
- **Vector Search**: Intelligent search through uploaded documents to find relevant content
- **Context-Aware Generation**: AI generates content based on your specific uploaded materials
- **Multiple Content Types**: Generate learning materials, lesson plans, and knowledge tests

### 📚 Content Management
- **Document Upload**: Easy PDF upload with metadata extraction
- **Content Preview**: Rich preview and editing capabilities for generated content
- **Approval Workflow**: Review and approve AI-generated content before use
- **Module Integration**: Add generated content directly to course modules

### 🔍 Advanced Search
- **Semantic Search**: Find relevant content using natural language queries
- **Document Context**: Search through all uploaded documents for specific information
- **Relevance Scoring**: Results ranked by relevance to your query

## System Architecture

### Backend Components

#### RAG Service (`backend/app/services/rag_service.py`)
- **DocumentEmbedder**: Handles document chunking and vector embedding
- **RAGService**: Main service for content generation and retrieval
- **Vector Storage**: FAISS-based vector database for similarity search
- **OpenAI Integration**: GPT-3.5-turbo for content generation

#### Content Management API (`backend/app/api/content_management.py`)
- Document upload and processing endpoints
- Content generation endpoints
- Search and retrieval endpoints
- Module content management

#### Database Models
- **CourseFileContent**: Stores uploaded documents and metadata
- **ContentGeneration**: Tracks AI-generated content
- **CourseContent**: Stores content within course modules

### Frontend Components

#### Course Content Builder (`frontend/src/components/course-content-builder.tsx`)
- **Document Upload**: Drag-and-drop PDF upload interface
- **AI Generation**: Form-based content generation with RAG options
- **Content Search**: Search interface for finding relevant content
- **Module Management**: Integration with course modules

#### Content Preview (`frontend/src/components/content-preview.tsx`)
- **Rich Preview**: Formatted display of different content types
- **Inline Editing**: Edit generated content directly
- **Export Options**: Copy, download, and save content
- **Approval Workflow**: Approve content for use in courses

## Usage Guide

### For Instructors

#### 1. Upload Documents
1. Navigate to your course in the instructor dashboard
2. Click "AI Content Builder"
3. Go to the "Documents" tab
4. Upload PDF files with titles and descriptions
5. Click "Process for AI" to create embeddings

#### 2. Generate Content
1. Go to the "AI Generation" tab
2. Select content type (Learning Material, Lesson Plan, Knowledge Test)
3. Choose whether to use RAG (uploaded documents) or generate from scratch
4. Enter title, description, and additional instructions
5. Click "Generate Content"

#### 3. Review and Approve
1. Review generated content in the preview
2. Edit content if needed using the inline editor
3. Click "Approve" to make content available for use
4. Copy or download content as needed

#### 4. Search Content
1. Go to the "Search Content" tab
2. Enter natural language queries
3. Review search results with relevance scores
4. Use relevant content in your courses

### Content Types

#### Learning Materials
- Structured educational content
- Learning objectives
- Key concepts and definitions
- Practical examples
- Summary points

#### Lesson Plans
- Learning objectives
- Duration and timing
- Materials needed
- Step-by-step structure
- Activities and exercises
- Assessment methods

#### Knowledge Tests
- Multiple choice questions
- Answer options with correct answers
- Explanations and references
- Difficulty levels (easy, medium, hard)

## Technical Implementation

### Dependencies

#### Backend
```python
# AI/ML Integration
openai==1.3.7
sentence-transformers==2.2.2
faiss-cpu==1.7.4
numpy==1.24.3
```

#### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Lucide React for icons

### API Endpoints

#### Document Management
- `POST /api/content/documents/upload` - Upload documents
- `POST /api/content/documents/{id}/process` - Process document for AI
- `GET /api/content/courses/{id}/documents` - Get course documents

#### Content Generation
- `POST /api/content/courses/{id}/generate-content` - Generate AI content
- `GET /api/content/courses/{id}/generated-content` - Get generated content
- `POST /api/content/generated-content/{id}/approve` - Approve content

#### Search and Retrieval
- `POST /api/content/courses/{id}/search` - Search course content

#### Module Management
- `POST /api/content/modules/{id}/content` - Add content to module
- `GET /api/content/modules/{id}/content` - Get module content
- `PUT /api/content/content/{id}` - Update content
- `DELETE /api/content/content/{id}` - Delete content

### Vector Storage

The system uses FAISS (Facebook AI Similarity Search) for vector storage:
- **Index Type**: IndexFlatIP (Inner Product for cosine similarity)
- **Embedding Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Chunking**: 500 characters with 50 character overlap
- **Storage**: Local filesystem with JSON metadata

### Content Processing Pipeline

1. **Document Upload**: PDF files uploaded and validated
2. **Text Extraction**: PyPDF2 extracts text content
3. **Chunking**: Text split into overlapping chunks
4. **Embedding**: Chunks converted to vector embeddings
5. **Storage**: Embeddings stored in FAISS index
6. **Metadata**: Document metadata stored in JSON

### AI Generation Pipeline

1. **Query Processing**: User query processed for context
2. **Document Retrieval**: Relevant chunks retrieved using vector similarity
3. **Context Building**: Retrieved chunks combined into context
4. **Prompt Construction**: RAG prompt built with context and instructions
5. **AI Generation**: OpenAI API generates content
6. **Storage**: Generated content stored in database
7. **Approval**: Content reviewed and approved by instructor

## Configuration

### Environment Variables

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Database URL
DATABASE_URL=sqlite:///./operator_skills_hub.db

# Vector Store Path
VECTOR_STORE_PATH=data/vector_store
```

### File Storage

- **Upload Directory**: `uploads/courses/`
- **Vector Store**: `data/vector_store/`
- **Max File Size**: 50MB
- **Allowed Types**: PDF only

## Security Considerations

- **Access Control**: Only instructors can upload and generate content
- **File Validation**: PDF files validated for type and size
- **Content Review**: All AI-generated content requires approval
- **Data Privacy**: Documents processed locally, only metadata stored

## Performance Optimization

- **Chunking Strategy**: Optimal chunk size for retrieval accuracy
- **Vector Indexing**: FAISS for fast similarity search
- **Caching**: Generated content cached in database
- **Lazy Loading**: Content loaded on demand

## Future Enhancements

- **Multi-format Support**: Support for Word, PowerPoint, and other formats
- **Advanced Chunking**: Semantic chunking based on content structure
- **Custom Models**: Fine-tuned models for construction industry
- **Collaborative Editing**: Multiple instructors working on content
- **Version Control**: Track changes and revisions
- **Analytics**: Usage analytics and content performance metrics

## Troubleshooting

### Common Issues

1. **Document Processing Fails**
   - Check file size (max 50MB)
   - Ensure PDF is not password protected
   - Verify file is not corrupted

2. **AI Generation Fails**
   - Check OpenAI API key
   - Verify sufficient API credits
   - Check network connectivity

3. **Search Returns No Results**
   - Ensure documents are processed
   - Check vector store is created
   - Verify search query is relevant

### Debug Mode

Enable debug logging by setting:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.


