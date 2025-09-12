#!/usr/bin/env python3
"""
AI Demo Script for Operator Skills Hub
Demonstrates the AI content generation capabilities
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.simple_ai_generator import SimpleAIContentGenerator
from app.core.config import settings

def demo_ai_content_generation():
    """Demonstrate AI content generation capabilities"""
    print("🤖 AI Content Generation Demo")
    print("=" * 50)
    
    # Initialize the AI generator
    generator = SimpleAIContentGenerator()
    
    # Sample construction content
    sample_content = """
    Construction Safety Fundamentals
    
    Personal Protective Equipment (PPE) is essential for all construction workers.
    Hard hats protect against head injuries from falling objects and impacts.
    Safety glasses prevent eye injuries from debris, dust, and chemicals.
    Steel-toed boots protect feet from heavy objects and sharp materials.
    High-visibility clothing ensures workers are visible to equipment operators.
    
    Hazard identification is crucial for preventing accidents on construction sites.
    Common hazards include slip, trip, and fall risks from uneven surfaces.
    Electrical hazards can cause serious injuries or death if not properly managed.
    Heavy machinery poses significant risks if not operated by qualified personnel.
    Working at height requires special safety measures and fall protection.
    
    Safety procedures must be followed at all times to ensure worker protection.
    Pre-work safety checks should be conducted before starting any task.
    Proper tool usage and maintenance prevents equipment-related accidents.
    Emergency procedures must be clearly communicated to all workers.
    All incidents must be reported immediately to supervisors.
    """
    
    print("\n📚 Generating Learning Material...")
    learning_material = generator.generate_learning_material(
        original_content=sample_content,
        title="Construction Safety Fundamentals",
        description="Essential safety principles for construction workers",
        additional_instructions="Focus on practical applications and UK construction standards"
    )
    
    print(f"Status: {learning_material['status']}")
    print(f"Model: {learning_material.get('ai_model', 'N/A')}")
    if learning_material['status'] == 'success':
        print("✅ Learning material generated successfully")
        print("\nPreview:")
        print(learning_material['content'][:300] + "...")
    else:
        print("⚠️  Using mock content (API key not configured)")
    
    print("\n📋 Generating Lesson Plan...")
    lesson_plan = generator.generate_lesson_plan(
        original_content=sample_content,
        title="Construction Safety Training",
        description="Comprehensive safety training for construction workers",
        additional_instructions="Include hands-on activities and practical demonstrations"
    )
    
    print(f"Status: {lesson_plan['status']}")
    if lesson_plan['status'] == 'success':
        print("✅ Lesson plan generated successfully")
        print("\nPreview:")
        print(lesson_plan['content'][:300] + "...")
    else:
        print("⚠️  Using mock content (API key not configured)")
    
    print("\n📝 Generating Knowledge Test...")
    knowledge_test = generator.generate_knowledge_test(
        original_content=sample_content,
        title="Construction Safety Assessment",
        description="Test knowledge of construction safety principles",
        additional_instructions="Create questions suitable for UK construction workers",
        question_count=5
    )
    
    print(f"Status: {knowledge_test['status']}")
    if knowledge_test['status'] == 'success':
        print("✅ Knowledge test generated successfully")
        print("\nPreview:")
        print(knowledge_test['content'][:300] + "...")
    else:
        print("⚠️  Using mock content (API key not configured)")
    
    return learning_material, lesson_plan, knowledge_test

def demo_configuration():
    """Demonstrate configuration settings"""
    print("\n⚙️  AI Configuration Settings")
    print("=" * 50)
    
    print(f"AI Model: {settings.ai_model}")
    print(f"Max Tokens: {settings.ai_max_tokens}")
    print(f"Temperature: {settings.ai_temperature}")
    print(f"Embedding Model: {settings.ai_embedding_model}")
    print(f"Vector Store Path: {settings.vector_store_path}")
    print(f"Vector Dimension: {settings.vector_dimension}")
    print(f"Default Question Count: {settings.default_question_count}")
    print(f"Default Passing Score: {settings.default_passing_score}")
    print(f"Default Time Limit: {settings.default_time_limit}")
    
    # Check API key status
    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
    if api_key:
        print(f"\n✅ OpenAI API Key: {'*' * (len(api_key) - 8) + api_key[-8:]}")
    else:
        print("\n⚠️  OpenAI API Key: Not configured (will use mock content)")

def demo_uk_english_features():
    """Demonstrate UK English features"""
    print("\n🇬🇧 UK English Features")
    print("=" * 50)
    
    print("The AI system is configured to use UK English throughout:")
    print("• 'colour' instead of 'color'")
    print("• 'realise' instead of 'realize'")
    print("• 'centre' instead of 'center'")
    print("• 'organise' instead of 'organize'")
    print("• 'emphasise' instead of 'emphasize'")
    print("• 'specialising' instead of 'specializing'")
    
    print("\nKnowledge test features:")
    print("• Answer options are similar in length")
    print("• Correct answers placed in random positions")
    print("• Questions focus on UK construction standards")

def main():
    """Main demo function"""
    print("🚀 Operator Skills Hub - AI System Demo")
    print("=" * 60)
    
    # Show configuration
    demo_configuration()
    
    # Show UK English features
    demo_uk_english_features()
    
    # Demonstrate content generation
    learning_material, lesson_plan, knowledge_test = demo_ai_content_generation()
    
    print("\n" + "=" * 60)
    print("🎉 AI Demo completed successfully!")
    
    print("\nNext steps:")
    print("1. Set your OPENAI_API_KEY in the .env file for real AI generation")
    print("2. Configure your database connection")
    print("3. Start using the AI services in your application")
    
    print("\nFor more information, see AI_CONFIGURATION_GUIDE.md")

if __name__ == "__main__":
    main()

