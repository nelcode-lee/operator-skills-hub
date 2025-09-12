#!/usr/bin/env python3
"""
AI Configuration Script for Operator Skills Hub
This script helps configure AI services and dependencies
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_dependencies():
    """Install required AI dependencies"""
    print("\n🔧 Installing AI dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def create_directories():
    """Create necessary directories for AI services"""
    print("\n📁 Creating AI service directories...")
    directories = [
        "data/vector_store",
        "data/embeddings",
        "logs/ai",
        "uploads/ai_generated"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def check_environment_variables():
    """Check if required environment variables are set"""
    print("\n🔍 Checking environment variables...")
    
    required_vars = [
        "OPENAI_API_KEY",
        "DATABASE_URL"
    ]
    
    optional_vars = [
        "PINECONE_API_KEY",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY"
    ]
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
        else:
            print(f"✅ {var} is set")
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
        else:
            print(f"✅ {var} is set")
    
    if missing_required:
        print(f"\n❌ Missing required environment variables: {', '.join(missing_required)}")
        print("Please set these in your .env file or environment")
        return False
    
    if missing_optional:
        print(f"\n⚠️  Missing optional environment variables: {', '.join(missing_optional)}")
        print("These are not required but may limit functionality")
    
    return True

def test_ai_services():
    """Test AI services configuration"""
    print("\n🧪 Testing AI services...")
    
    try:
        # Test OpenAI connection
        from app.services.ai_content_generator import AIContentGenerator
        generator = AIContentGenerator()
        
        if generator.api_key:
            print("✅ OpenAI API key configured")
        else:
            print("⚠️  OpenAI API key not configured - will use mock data")
        
        # Test embedding model
        from app.services.rag_service import DocumentEmbedder
        embedder = DocumentEmbedder()
        print("✅ Embedding model loaded successfully")
        
        # Test database connection
        from app.core.database import get_db
        print("✅ Database connection configured")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing AI services: {e}")
        return False

def create_env_template():
    """Create a template .env file with AI configuration"""
    env_template = """# AI Configuration Template
# Copy this to .env and fill in your actual values

# Required AI Services
OPENAI_API_KEY=your-openai-api-key-here

# Database (Neon DB recommended)
DATABASE_URL=postgresql://username:password@host:port/database

# Optional AI Services
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=us-west1-gcp

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

# Other services...
REDIS_URL=redis://localhost:6379
"""
    
    with open(".env.template", "w") as f:
        f.write(env_template)
    
    print("✅ Created .env.template file")
    print("📝 Copy this to .env and configure with your actual values")

def main():
    """Main configuration function"""
    print("🚀 Operator Skills Hub - AI Configuration")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Failed to install dependencies. Please check the error messages above.")
        sys.exit(1)
    
    # Create environment template
    create_env_template()
    
    # Check environment variables
    env_ok = check_environment_variables()
    
    # Test AI services
    services_ok = test_ai_services()
    
    print("\n" + "=" * 50)
    if env_ok and services_ok:
        print("🎉 AI configuration completed successfully!")
        print("\nNext steps:")
        print("1. Copy .env.template to .env")
        print("2. Add your actual API keys to .env")
        print("3. Run the application with: uvicorn app.main:app --reload")
    else:
        print("⚠️  AI configuration completed with warnings")
        print("Please check the messages above and configure missing items")
    
    print("\nFor more information, see the AI_Implementation_Strategy.md file")

if __name__ == "__main__":
    main()

