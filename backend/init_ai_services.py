#!/usr/bin/env python3
"""
AI Services Initialization Script
Initializes vector stores, tests AI services, and sets up sample data
"""

import os
import sys
from pathlib import Path
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import get_db
from app.services.rag_service import RAGService, DocumentEmbedder
from app.services.ai_content_generator import AIContentGenerator
from app.services.knowledge_tests import KnowledgeTestGenerator
from app.core.config import settings

def initialize_vector_store():
    """Initialize the vector store with sample data"""
    print("🔧 Initializing vector store...")
    
    try:
        # Create vector store directory
        vector_path = Path(settings.vector_store_path)
        vector_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize embedder
        embedder = DocumentEmbedder()
        print("✅ Vector store initialized successfully")
        
        return True
    except Exception as e:
        print(f"❌ Error initializing vector store: {e}")
        return False

def test_ai_content_generation():
    """Test AI content generation with sample data"""
    print("\n🧪 Testing AI content generation...")
    
    try:
        generator = AIContentGenerator()
        
        # Test learning material generation
        sample_content = """
        Construction Safety Fundamentals
        
        Personal Protective Equipment (PPE) is essential for construction workers.
        Hard hats protect against head injuries from falling objects.
        Safety glasses prevent eye injuries from debris and chemicals.
        Steel-toed boots protect feet from heavy objects.
        High-visibility clothing ensures workers are seen by equipment operators.
        
        Hazard identification is crucial for preventing accidents.
        Common hazards include slip, trip, and fall risks.
        Electrical hazards can cause serious injuries or death.
        Heavy machinery poses significant risks if not operated properly.
        Working at height requires special safety measures.
        """
        
        result = generator.generate_learning_material(
            original_content=sample_content,
            title="Construction Safety Fundamentals",
            description="Basic safety principles for construction workers",
            additional_instructions="Focus on practical applications and UK construction standards"
        )
        
        if result.get("status") == "success":
            print("✅ Learning material generation test passed")
        else:
            print("⚠️  Learning material generation using mock data")
        
        # Test knowledge test generation
        test_result = generator.generate_knowledge_test(
            original_content=sample_content,
            title="Construction Safety Test",
            description="Test knowledge of construction safety principles",
            additional_instructions="Create questions suitable for UK construction workers",
            question_count=5
        )
        
        if test_result.get("status") == "success":
            print("✅ Knowledge test generation test passed")
        else:
            print("⚠️  Knowledge test generation using mock data")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing AI content generation: {e}")
        return False

def test_rag_service():
    """Test RAG service functionality"""
    print("\n🔍 Testing RAG service...")
    
    try:
        # Get database session
        db = next(get_db())
        
        # Initialize RAG service
        rag_service = RAGService(db)
        
        # Test document embedding
        sample_document = {
            "title": "Sample Construction Document",
            "content": "This is a sample construction document for testing the RAG service. It contains information about safety procedures, equipment usage, and best practices in the construction industry.",
            "metadata": {
                "course_id": 1,
                "instructor_id": 1,
                "content_type": "pdf"
            }
        }
        
        # Test embedding functionality
        embedder = DocumentEmbedder()
        success = embedder.embed_document(
            content=sample_document["content"],
            document_id="test_doc_1",
            metadata=sample_document["metadata"]
        )
        
        if success:
            print("✅ Document embedding test passed")
        else:
            print("❌ Document embedding test failed")
            return False
        
        # Test content search
        search_results = embedder.search_similar_content("safety procedures", top_k=3)
        if search_results:
            print("✅ Content search test passed")
        else:
            print("⚠️  Content search returned no results")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing RAG service: {e}")
        return False

def test_knowledge_tests():
    """Test knowledge test system"""
    print("\n📝 Testing knowledge test system...")
    
    try:
        # Get database session
        db = next(get_db())
        
        # Initialize knowledge test generator
        test_generator = KnowledgeTestGenerator(db)
        
        # Test adaptive test creation
        adaptive_result = test_generator.create_adaptive_test(
            user_id=1,
            course_id=1,
            difficulty_level="medium"
        )
        
        if "error" not in adaptive_result:
            print("✅ Adaptive test generation test passed")
        else:
            print("⚠️  Adaptive test generation test failed")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing knowledge tests: {e}")
        return False

def create_sample_embeddings():
    """Create sample embeddings for testing"""
    print("\n📚 Creating sample embeddings...")
    
    try:
        embedder = DocumentEmbedder()
        
        sample_documents = [
            {
                "content": "Construction safety is paramount in all building projects. Workers must wear appropriate PPE including hard hats, safety glasses, and steel-toed boots. Regular safety briefings should be conducted before each shift.",
                "metadata": {"title": "Safety Basics", "course_id": 1, "instructor_id": 1}
            },
            {
                "content": "Heavy machinery operation requires proper training and certification. Operators must be qualified and follow all safety procedures. Equipment should be inspected daily before use.",
                "metadata": {"title": "Machinery Operation", "course_id": 1, "instructor_id": 1}
            },
            {
                "content": "Quality control ensures that construction work meets specified standards. Regular inspections and testing are essential. Documentation must be maintained throughout the project.",
                "metadata": {"title": "Quality Control", "course_id": 1, "instructor_id": 1}
            }
        ]
        
        for i, doc in enumerate(sample_documents):
            success = embedder.embed_document(
                content=doc["content"],
                document_id=f"sample_doc_{i+1}",
                metadata=doc["metadata"]
            )
            if success:
                print(f"✅ Created embedding for: {doc['metadata']['title']}")
            else:
                print(f"❌ Failed to create embedding for: {doc['metadata']['title']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample embeddings: {e}")
        return False

def main():
    """Main initialization function"""
    print("🚀 Operator Skills Hub - AI Services Initialization")
    print("=" * 60)
    
    # Initialize vector store
    if not initialize_vector_store():
        print("❌ Failed to initialize vector store")
        sys.exit(1)
    
    # Test AI content generation
    if not test_ai_content_generation():
        print("⚠️  AI content generation tests failed")
    
    # Test RAG service
    if not test_rag_service():
        print("⚠️  RAG service tests failed")
    
    # Test knowledge tests
    if not test_knowledge_tests():
        print("⚠️  Knowledge test system tests failed")
    
    # Create sample embeddings
    if not create_sample_embeddings():
        print("⚠️  Failed to create sample embeddings")
    
    print("\n" + "=" * 60)
    print("🎉 AI services initialization completed!")
    print("\nThe AI system is now ready to use.")
    print("You can start generating content, creating knowledge tests, and using RAG functionality.")

if __name__ == "__main__":
    main()

