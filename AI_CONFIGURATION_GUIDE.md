# AI Configuration Guide - Operator Skills Hub

This guide explains how to configure and use the AI services in the Operator Skills Hub platform.

## 🚀 Quick Start

### 1. Environment Setup

The AI system is now configured with the following components:

- **OpenAI Integration**: For content generation and knowledge tests
- **Simplified RAG Service**: For document processing and retrieval
- **Vector Storage**: Using FAISS for document embeddings
- **UK English Support**: All content generated uses British spelling and terminology

### 2. Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Required AI Services
OPENAI_API_KEY=your-openai-api-key-here

# Database (Neon DB recommended)
DATABASE_URL=postgresql://username:password@host:port/database

# AI Model Configuration
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
AI_EMBEDDING_MODEL=all-MiniLM-L6-v2

# Vector Store Configuration
VECTOR_STORE_PATH=data/vector_store
VECTOR_DIMENSION=384
VECTOR_INDEX_TYPE=faiss

# Content Generation Settings
DEFAULT_QUESTION_COUNT=10
DEFAULT_PASSING_SCORE=70
DEFAULT_TIME_LIMIT=30

# Security
SECRET_KEY=your-secret-key-change-in-production
```

### 3. Installation

The AI dependencies are already installed. If you need to reinstall:

```bash
cd backend
source venv/bin/activate
pip install openai faiss-cpu numpy
```

## 🤖 AI Services Overview

### 1. Simple AI Content Generator

**Location**: `backend/app/services/simple_ai_generator.py`

**Features**:
- Learning material generation
- Lesson plan creation
- Knowledge test generation
- UK English spelling and terminology
- Mock content fallback when API unavailable

**Usage**:
```python
from app.services.simple_ai_generator import SimpleAIContentGenerator

generator = SimpleAIContentGenerator()

# Generate learning material
result = generator.generate_learning_material(
    original_content="Your content here",
    title="Construction Safety",
    description="Basic safety principles",
    additional_instructions="Focus on practical applications"
)
```

### 2. Simple RAG Service

**Location**: `backend/app/services/simple_rag_service.py`

**Features**:
- Document embedding and storage
- Content retrieval using vector similarity
- RAG-based content generation
- Course-specific content search

**Usage**:
```python
from app.services.simple_rag_service import SimpleRAGService

# Process uploaded document
rag_service = SimpleRAGService(db)
result = rag_service.process_uploaded_document(content_id, instructor_id)

# Generate content with RAG
content = rag_service.generate_course_content(
    course_id=1,
    instructor_id=1,
    content_type="learning_material",
    title="Safety Training",
    description="Basic safety concepts",
    use_rag=True
)
```

### 3. Knowledge Test System

**Location**: `backend/app/services/knowledge_tests.py`

**Features**:
- Adaptive test generation
- Multiple question types
- Random answer positioning
- Similar-length answer options
- UK English terminology

## 📋 Configuration Features

### UK English Support

All AI-generated content uses British English spelling and terminology:
- "colour" instead of "color"
- "realise" instead of "realize"
- "centre" instead of "center"
- "organise" instead of "organize"

### Answer Randomisation

Knowledge tests implement user preferences:
- Correct answers placed in random positions
- Answer options of similar length
- Prevents guessability patterns

### Content Quality

- Construction industry focus
- British standards compliance
- Practical application emphasis
- Safety-first approach

## 🔧 API Endpoints

### Content Generation

```http
POST /api/ai/generate-content
Content-Type: application/json

{
    "content_type": "learning_material",
    "title": "Construction Safety",
    "description": "Basic safety principles",
    "course_id": 1,
    "additional_instructions": "Focus on practical applications"
}
```

### Document Processing

```http
POST /api/ai/process-document
Content-Type: application/json

{
    "content_id": 123,
    "instructor_id": 456
}
```

### Knowledge Test Generation

```http
POST /api/ai/generate-test
Content-Type: application/json

{
    "content_id": 123,
    "question_count": 10,
    "test_type": "multiple_choice"
}
```

## 🧪 Testing the AI System

### 1. Test Content Generation

```bash
cd backend
source venv/bin/activate
python3 -c "
from app.services.simple_ai_generator import SimpleAIContentGenerator
generator = SimpleAIContentGenerator()
result = generator.generate_learning_material(
    'Construction safety is important',
    'Safety Basics',
    'Introduction to construction safety'
)
print('Status:', result['status'])
"
```

### 2. Test RAG Service

```bash
cd backend
source venv/bin/activate
python3 -c "
from app.services.simple_rag_service import SimpleRAGService
from app.core.database import get_db
db = next(get_db())
rag = SimpleRAGService(db)
print('RAG Service initialized successfully')
"
```

## 📊 Monitoring and Logs

### Log Files

- AI generation logs: `logs/ai/`
- Vector store data: `data/vector_store/`
- Generated content: `uploads/ai_generated/`

### Database Tables

- `content_generations`: Stores AI-generated content
- `predictive_scores`: Student performance predictions
- `instructor_metrics`: Teaching effectiveness data

## 🔒 Security Considerations

### API Key Management

- Store API keys in environment variables
- Never commit API keys to version control
- Use different keys for development/production

### Content Validation

- All AI-generated content requires human review
- Content approval workflow implemented
- Version control for generated materials

### Data Privacy

- Document processing respects user permissions
- Vector embeddings stored locally
- No sensitive data sent to external APIs

## 🚨 Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Error: "OpenAI API key not configured"
   - Solution: Set `OPENAI_API_KEY` in environment

2. **Vector Store Errors**
   - Error: "Error loading vector store"
   - Solution: Check `data/vector_store/` directory permissions

3. **Database Connection**
   - Error: "Database connection failed"
   - Solution: Verify `DATABASE_URL` configuration

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Optimization

### Vector Store

- Documents chunked for better retrieval
- FAISS index optimised for similarity search
- Metadata stored separately for quick access

### Content Generation

- Caching implemented for repeated requests
- Batch processing for multiple documents
- Async processing for large content

### Database

- Indexed fields for fast queries
- Connection pooling configured
- Query optimization implemented

## 🔄 Updates and Maintenance

### Regular Tasks

1. **Vector Store Backup**
   ```bash
   cp -r data/vector_store/ backups/vector_store_$(date +%Y%m%d)/
   ```

2. **Log Rotation**
   ```bash
   find logs/ai/ -name "*.log" -mtime +30 -delete
   ```

3. **Content Cleanup**
   ```bash
   find uploads/ai_generated/ -mtime +90 -delete
   ```

### Version Updates

When updating AI dependencies:

```bash
cd backend
source venv/bin/activate
pip install --upgrade openai faiss-cpu numpy
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [FAISS Documentation](https://faiss.ai/)
- [UK English Style Guide](https://www.oxfordlearnersdictionaries.com/us/grammar/british-and-american-english)

## 🆘 Support

For technical support or questions about AI configuration:

1. Check the logs in `logs/ai/`
2. Review the configuration in `app/core/config.py`
3. Test individual services using the provided scripts
4. Verify environment variables are correctly set

---

**Note**: This AI system is designed to work with or without external API keys. When API keys are not available, the system falls back to mock content generation to ensure functionality is maintained.

