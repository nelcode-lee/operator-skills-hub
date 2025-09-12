"""
Simplified RAG (Retrieval-Augmented Generation) Service for Course Content
A lightweight version that works without heavy ML dependencies
"""

import os
import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
import openai
import faiss
import pickle
from pathlib import Path

from ..models.course import CourseFileContent, Course
from ..models.ai import ContentGeneration
from ..core.config import settings


class SimpleDocumentEmbedder:
    """Simplified document embedding using basic text processing"""
    
    def __init__(self):
        self.embedding_dim = settings.vector_dimension
        self.vector_store_path = Path(settings.vector_store_path)
        self.vector_store_path.mkdir(parents=True, exist_ok=True)
        self.index = None
        self.document_metadata = {}
        self._load_vector_store()
    
    def _load_vector_store(self):
        """Load existing vector store if available"""
        index_path = self.vector_store_path / "faiss_index.bin"
        metadata_path = self.vector_store_path / "metadata.json"
        
        if index_path.exists() and metadata_path.exists():
            try:
                self.index = faiss.read_index(str(index_path))
                with open(metadata_path, 'r') as f:
                    self.document_metadata = json.load(f)
            except Exception as e:
                print(f"Error loading vector store: {e}")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index"""
        self.index = faiss.IndexFlatIP(self.embedding_dim)  # Inner product for cosine similarity
        self.document_metadata = {}
    
    def _save_vector_store(self):
        """Save vector store to disk"""
        try:
            index_path = self.vector_store_path / "faiss_index.bin"
            metadata_path = self.vector_store_path / "metadata.json"
            
            faiss.write_index(self.index, str(index_path))
            with open(metadata_path, 'w') as f:
                json.dump(self.document_metadata, f, indent=2)
        except Exception as e:
            print(f"Error saving vector store: {e}")
    
    def _simple_embedding(self, text: str) -> np.ndarray:
        """Create a simple embedding using basic text features"""
        # Simple bag-of-words approach with TF-IDF-like weighting
        words = text.lower().split()
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Create a simple embedding vector
        embedding = np.zeros(self.embedding_dim)
        
        # Use word hashing to create features
        for word, count in word_counts.items():
            # Simple hash-based feature
            hash_val = hash(word) % self.embedding_dim
            embedding[hash_val] += count
        
        # Normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding.astype('float32')
    
    def embed_document(self, content: str, document_id: str, metadata: Dict[str, Any]) -> bool:
        """Embed a document and add to vector store"""
        try:
            # Split content into chunks for better retrieval
            chunks = self._chunk_text(content, chunk_size=500, overlap=50)
            
            for i, chunk in enumerate(chunks):
                # Generate embedding
                embedding = self._simple_embedding(chunk)
                
                # Add to index
                self.index.add(embedding.reshape(1, -1))
                
                # Store metadata
                chunk_id = f"{document_id}_chunk_{i}"
                self.document_metadata[chunk_id] = {
                    "document_id": document_id,
                    "chunk_index": i,
                    "content": chunk,
                    "metadata": metadata,
                    "created_at": datetime.now().isoformat()
                }
            
            # Save updated vector store
            self._save_vector_store()
            return True
            
        except Exception as e:
            print(f"Error embedding document: {e}")
            return False
    
    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk.strip())
        
        return chunks
    
    def search_similar_content(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar content using vector similarity"""
        try:
            # Generate query embedding
            query_embedding = self._simple_embedding(query)
            
            # Search for similar vectors
            scores, indices = self.index.search(query_embedding.reshape(1, -1), top_k)
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.document_metadata):
                    chunk_data = self.document_metadata[f"doc_{idx//10}_chunk_{idx%10}"]  # Approximate mapping
                    results.append({
                        "score": float(score),
                        "content": chunk_data["content"],
                        "document_id": chunk_data["document_id"],
                        "chunk_index": chunk_data["chunk_index"],
                        "metadata": chunk_data["metadata"]
                    })
            
            return results
            
        except Exception as e:
            print(f"Error searching similar content: {e}")
            return []


class SimpleRAGService:
    """Simplified RAG service for course content generation"""
    
    def __init__(self, db: Session):
        self.db = db
        self.embedder = SimpleDocumentEmbedder()
        self.openai_client = openai.OpenAI(api_key=settings.openai_api_key or os.getenv("OPENAI_API_KEY", ""))
    
    def process_uploaded_document(self, content_id: int, instructor_id: int) -> Dict[str, Any]:
        """Process uploaded document and create embeddings"""
        try:
            # Get document from database
            document = self.db.query(CourseFileContent).filter(
                CourseFileContent.id == content_id,
                CourseFileContent.instructor_id == instructor_id
            ).first()
            
            if not document:
                return {"error": "Document not found or access denied"}
            
            # Extract text content from PDF
            if document.file_path and document.content_type == "pdf":
                text_content = self._extract_pdf_text(document.file_path)
            else:
                text_content = document.description or ""
            
            if not text_content.strip():
                return {"error": "No text content found in document"}
            
            # Create document metadata
            metadata = {
                "course_id": document.course_id,
                "instructor_id": instructor_id,
                "title": document.title,
                "description": document.description,
                "content_type": document.content_type,
                "file_path": document.file_path,
                "created_at": document.created_at.isoformat()
            }
            
            # Embed document
            document_id = f"doc_{content_id}"
            success = self.embedder.embed_document(text_content, document_id, metadata)
            
            if success:
                return {
                    "status": "success",
                    "document_id": document_id,
                    "chunks_created": len(self.embedder.document_metadata),
                    "message": "Document successfully processed and embedded"
                }
            else:
                return {"error": "Failed to process document"}
                
        except Exception as e:
            return {"error": f"Error processing document: {str(e)}"}
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            import PyPDF2
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return ""
    
    def generate_course_content(self, 
                              course_id: int, 
                              instructor_id: int,
                              content_type: str,
                              title: str,
                              description: str,
                              additional_instructions: str = "",
                              use_rag: bool = True) -> Dict[str, Any]:
        """Generate course content using RAG and AI"""
        try:
            # Get course information
            course = self.db.query(Course).filter(
                Course.id == course_id,
                Course.instructor_id == instructor_id
            ).first()
            
            if not course:
                return {"error": "Course not found or access denied"}
            
            # Get relevant documents for this course
            relevant_docs = self._get_course_documents(course_id)
            
            # Build context from relevant documents
            context = self._build_context_from_documents(relevant_docs, description)
            
            # Generate content using AI
            if use_rag and context:
                generated_content = self._generate_with_rag(
                    content_type, title, description, context, additional_instructions
                )
            else:
                generated_content = self._generate_without_rag(
                    content_type, title, description, additional_instructions
                )
            
            # Save generated content to database
            content_generation = ContentGeneration(
                prompt=f"Generate {content_type} for course {course_id}",
                generated_content=generated_content["content"],
                model_used=generated_content.get("model", settings.ai_model),
                content_type=content_type,
                course_id=course_id,
                is_approved=False
            )
            
            self.db.add(content_generation)
            self.db.commit()
            
            return {
                "status": "success",
                "content": generated_content["content"],
                "content_type": content_type,
                "generation_id": content_generation.id,
                "sources_used": len(relevant_docs),
                "model_used": generated_content.get("model", settings.ai_model)
            }
            
        except Exception as e:
            self.db.rollback()
            return {"error": f"Error generating content: {str(e)}"}
    
    def _get_course_documents(self, course_id: int) -> List[Dict[str, Any]]:
        """Get all documents for a course"""
        documents = self.db.query(CourseFileContent).filter(
            CourseFileContent.course_id == course_id,
            CourseFileContent.is_active == True
        ).all()
        
        return [
            {
                "id": doc.id,
                "title": doc.title,
                "description": doc.description,
                "content_type": doc.content_type,
                "file_path": doc.file_path,
                "created_at": doc.created_at
            }
            for doc in documents
        ]
    
    def _build_context_from_documents(self, documents: List[Dict[str, Any]], query: str) -> str:
        """Build context from relevant document chunks"""
        if not documents:
            return ""
        
        # Search for relevant chunks
        relevant_chunks = self.embedder.search_similar_content(query, top_k=10)
        
        # Build context string
        context_parts = []
        for chunk in relevant_chunks:
            context_parts.append(f"Source: {chunk['metadata']['title']}\n{chunk['content']}\n")
        
        return "\n".join(context_parts)
    
    def _generate_with_rag(self, content_type: str, title: str, description: str, 
                          context: str, additional_instructions: str) -> Dict[str, Any]:
        """Generate content using RAG with context from documents"""
        try:
            if not self.openai_client.api_key:
                return self._generate_mock_content(content_type, title, description)
            
            prompt = self._build_rag_prompt(content_type, title, description, context, additional_instructions)
            
            response = self.openai_client.chat.completions.create(
                model=settings.ai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator specialising in construction industry training. Create high-quality, practical educational materials based on the provided context documents. Use UK English spelling and terminology throughout. Ensure all content follows British construction standards and regulations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=settings.ai_max_tokens,
                temperature=settings.ai_temperature
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": settings.ai_model
            }
            
        except Exception as e:
            print(f"Error generating with RAG: {e}")
            return self._generate_mock_content(content_type, title, description)
    
    def _generate_without_rag(self, content_type: str, title: str, description: str, 
                             additional_instructions: str) -> Dict[str, Any]:
        """Generate content without RAG (fallback)"""
        try:
            if not self.openai_client.api_key:
                return self._generate_mock_content(content_type, title, description)
            
            prompt = self._build_basic_prompt(content_type, title, description, additional_instructions)
            
            response = self.openai_client.chat.completions.create(
                model=settings.ai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator specialising in construction industry training. Create high-quality, practical educational materials. Use UK English spelling and terminology throughout. Ensure all content follows British construction standards and regulations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=settings.ai_max_tokens,
                temperature=settings.ai_temperature
            )
            
            return {
                "content": response.choices[0].message.content,
                "model": settings.ai_model
            }
            
        except Exception as e:
            print(f"Error generating without RAG: {e}")
            return self._generate_mock_content(content_type, title, description)
    
    def _build_rag_prompt(self, content_type: str, title: str, description: str, 
                         context: str, additional_instructions: str) -> str:
        """Build prompt for RAG-based content generation"""
        base_prompt = f"""
        Create a comprehensive {content_type} based on the following information:
        
        Title: {title}
        Description: {description}
        Additional Instructions: {additional_instructions}
        
        Context from uploaded documents:
        {context}
        
        Please generate:
        """
        
        if content_type == "learning_material":
            return base_prompt + """
            1. A structured learning material with clear sections
            2. Key learning objectives based on the context
            3. Important concepts and definitions from the documents
            4. Practical examples and applications relevant to construction
            5. Summary points that reinforce the key concepts
            6. References to specific sections from the source documents
            
            Use UK English spelling and terminology throughout. Format the output as a well-structured educational resource suitable for construction industry training.
            """
        elif content_type == "lesson_plan":
            return base_prompt + """
            1. Learning objectives based on the document content
            2. Duration and timing appropriate for the material
            3. Materials needed (including references to source documents)
            4. Step-by-step lesson structure
            5. Activities and exercises that use the document content
            6. Assessment methods that test understanding of the material
            7. Key points to emphasise from the source documents
            
            Use UK English spelling and terminology throughout. Format as a professional lesson plan suitable for construction industry training.
            """
        elif content_type == "knowledge_test":
            return base_prompt + """
            1. 10 multiple choice questions based on the document content
            2. Each question should have 4 answer options
            3. Include the correct answer for each question
            4. Questions should test understanding of key concepts from the documents
            5. Mix difficulty levels (easy, medium, hard)
            6. Focus on practical application in construction industry
            7. Include explanations that reference the source material
            8. Ensure all answer options are similar in length to avoid guessability
            9. Place correct answers in random positions (not always A or top-right)
            10. Use UK English spelling and terminology throughout
            
            Format as JSON with the following structure:
            {
                "questions": [
                    {
                        "id": 1,
                        "question": "Question text here",
                        "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
                        "correct_answer": "B",
                        "explanation": "Why this is correct (reference source document)"
                    }
                ]
            }
            """
        else:
            return base_prompt + f"Create comprehensive {content_type} content suitable for construction industry training. Use UK English spelling and terminology throughout."
    
    def _build_basic_prompt(self, content_type: str, title: str, description: str, 
                           additional_instructions: str) -> str:
        """Build basic prompt without RAG context"""
        return f"""
        Create a comprehensive {content_type} based on the following information:
        
        Title: {title}
        Description: {description}
        Additional Instructions: {additional_instructions}
        
        Please generate high-quality educational content suitable for construction industry training. Use UK English spelling and terminology throughout.
        """
    
    def _generate_mock_content(self, content_type: str, title: str, description: str) -> Dict[str, Any]:
        """Generate mock content when AI is not available"""
        if content_type == "learning_material":
            content = f"""
# Learning Material: {title}

## Description
{description}

## Learning Objectives
- Understand key concepts related to {title}
- Apply knowledge in practical construction scenarios
- Demonstrate competency in relevant skills

## Key Concepts
Based on the uploaded documents and industry best practices:

### 1. Fundamental Principles
- Core concepts and definitions
- Industry standards and regulations
- Safety considerations

### 2. Practical Applications
- Real-world implementation
- Common challenges and solutions
- Best practices

### 3. Assessment Criteria
- Key performance indicators
- Competency requirements
- Evaluation methods

## Summary
This learning material provides comprehensive coverage of {title} with practical applications for construction industry professionals.

*Note: This content was generated using AI based on uploaded documents. Please review and customise as needed.*
"""
        elif content_type == "lesson_plan":
            content = f"""
# Lesson Plan: {title}

## Lesson Information
- **Duration**: 2 hours
- **Target Audience**: Construction professionals
- **Prerequisites**: Basic construction experience

## Learning Objectives
By the end of this lesson, students will be able to:
1. Understand key concepts related to {title}
2. Apply knowledge in practical scenarios
3. Demonstrate competency in relevant skills

## Materials Needed
- Source documents and reference materials
- Visual aids and diagrams
- Practical exercises and activities
- Assessment materials

## Lesson Structure

### Introduction (15 minutes)
- Welcome and introductions
- Overview of lesson objectives
- Context setting

### Main Content (90 minutes)
1. **Concept Introduction** (30 minutes)
   - Key concepts and definitions
   - Industry context and relevance
   - Safety considerations

2. **Practical Application** (30 minutes)
   - Hands-on exercises
   - Real-world scenarios
   - Problem-solving activities

3. **Assessment and Review** (30 minutes)
   - Knowledge checks
   - Practical demonstrations
   - Q&A session

### Conclusion (15 minutes)
- Key points summary
- Next steps and resources
- Feedback collection

## Key Points to Emphasise
- Safety first approach
- Practical application of knowledge
- Continuous learning and improvement

*Note: This lesson plan was generated using AI based on uploaded documents. Please review and customise as needed.*
"""
        else:  # knowledge_test
            content = json.dumps({
                "questions": [
                    {
                        "id": 1,
                        "question": f"What is the primary focus of {title}?",
                        "options": [
                            "General construction knowledge",
                            "Specific skills and competencies",
                            "Administrative procedures",
                            "Equipment maintenance"
                        ],
                        "correct_answer": "B",
                        "explanation": f"The primary focus of {title} is developing specific skills and competencies relevant to the construction industry."
                    },
                    {
                        "id": 2,
                        "question": f"Which of the following is most important when working with {title}?",
                        "options": [
                            "Speed of completion",
                            "Safety procedures",
                            "Cost efficiency",
                            "Team coordination"
                        ],
                        "correct_answer": "B",
                        "explanation": "Safety procedures are always the most important consideration in construction work."
                    },
                    {
                        "id": 3,
                        "question": f"How should you approach learning {title}?",
                        "options": [
                            "Memorise all procedures",
                            "Understand principles and apply them",
                            "Follow instructions exactly",
                            "Learn from mistakes only"
                        ],
                        "correct_answer": "B",
                        "explanation": "Understanding the underlying principles allows for better application in various situations."
                    }
                ]
            })
        
        return {
            "content": content,
            "model": "mock_generator"
        }
    
    def search_course_content(self, course_id: int, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant content within a course"""
        try:
            # Get course documents
            documents = self._get_course_documents(course_id)
            if not documents:
                return []
            
            # Search for relevant chunks
            relevant_chunks = self.embedder.search_similar_content(query, top_k)
            
            # Filter results to only include chunks from this course
            course_document_ids = {f"doc_{doc['id']}" for doc in documents}
            filtered_results = [
                chunk for chunk in relevant_chunks
                if chunk['document_id'] in course_document_ids
            ]
            
            return filtered_results[:top_k]
            
        except Exception as e:
            print(f"Error searching course content: {e}")
            return []

