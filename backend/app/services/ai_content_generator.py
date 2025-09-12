"""
AI Content Generation Service
Generates learning materials, lesson plans, and tests from uploaded content
"""

import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import requests
import os
from ..core.config import settings


class AIContentGenerator:
    """Service for generating educational content using AI"""
    
    def __init__(self):
        self.api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self.model = settings.ai_model
        self.max_tokens = settings.ai_max_tokens
        self.temperature = settings.ai_temperature
    
    def generate_learning_material(self, 
                                 original_content: str, 
                                 title: str, 
                                 description: str,
                                 additional_instructions: str = "") -> Dict[str, Any]:
        """Generate learning material from original content"""
        
        prompt = f"""
        Create a comprehensive learning material based on the following content:
        
        Title: {title}
        Description: {description}
        Additional Instructions: {additional_instructions}
        
        Original Content:
        {original_content[:2000]}...
        
        Please generate:
        1. A structured learning material with clear sections
        2. Key learning objectives
        3. Important concepts and definitions
        4. Practical examples and applications
        5. Summary points
        
        Format the output as a well-structured educational resource suitable for construction industry training.
        """
        
        return self._call_ai_api(prompt, "learning_material")
    
    def generate_lesson_plan(self, 
                           original_content: str, 
                           title: str, 
                           description: str,
                           additional_instructions: str = "") -> Dict[str, Any]:
        """Generate a lesson plan from original content"""
        
        prompt = f"""
        Create a detailed lesson plan based on the following content:
        
        Title: {title}
        Description: {description}
        Additional Instructions: {additional_instructions}
        
        Original Content:
        {original_content[:2000]}...
        
        Please generate:
        1. Learning objectives
        2. Duration and timing
        3. Materials needed
        4. Step-by-step lesson structure
        5. Activities and exercises
        6. Assessment methods
        7. Key points to emphasize
        
        Format as a professional lesson plan suitable for construction industry training.
        """
        
        return self._call_ai_api(prompt, "lesson_plan")
    
    def generate_knowledge_test(self, 
                              original_content: str, 
                              title: str, 
                              description: str,
                              additional_instructions: str = "",
                              question_count: int = 10) -> Dict[str, Any]:
        """Generate a knowledge test from original content"""
        
        prompt = f"""
        Create a knowledge test based on the following content:
        
        Title: {title}
        Description: {description}
        Additional Instructions: {additional_instructions}
        Number of Questions: {question_count}
        
        Original Content:
        {original_content[:2000]}...
        
        Please generate:
        1. {question_count} multiple choice questions
        2. Each question should have 4 answer options
        3. Include the correct answer for each question
        4. Questions should test understanding of key concepts
        5. Mix difficulty levels (easy, medium, hard)
        6. Focus on practical application in construction industry
        7. Ensure all answer options are similar in length to avoid guessability
        8. Place correct answers in random positions (not always A or top-right)
        9. Use UK English spelling and terminology throughout
        
        Format as JSON with the following structure:
        {{
            "questions": [
                {{
                    "id": 1,
                    "question": "Question text here",
                    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
                    "correct_answer": "B",
                    "explanation": "Why this is correct"
                }}
            ]
        }}
        """
        
        return self._call_ai_api(prompt, "knowledge_test")
    
    def _call_ai_api(self, prompt: str, content_type: str) -> Dict[str, Any]:
        """Call OpenAI API to generate content"""
        
        if not self.api_key:
            # Fallback to mock data if no API key
            return self._generate_mock_content(content_type)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator specializing in construction industry training. Create high-quality, practical educational materials. Use UK English spelling and terminology throughout. Ensure all content is appropriate for the construction industry and follows British standards and regulations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": self.max_tokens,
                "temperature": self.temperature
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            generated_content = result["choices"][0]["message"]["content"]
            
            return {
                "content": generated_content,
                "content_type": content_type,
                "generated_at": datetime.now().isoformat(),
                "ai_model": "gpt-3.5-turbo",
                "status": "success"
            }
            
        except Exception as e:
            # Fallback to mock data on error
            return self._generate_mock_content(content_type, str(e))
    
    def _generate_mock_content(self, content_type: str, error: str = None) -> Dict[str, Any]:
        """Generate mock content when AI API is not available"""
        
        if content_type == "learning_material":
            content = f"""
# Learning Material: Construction Safety Fundamentals

## Learning Objectives
- Understand basic construction safety principles
- Identify common hazards in construction work
- Apply safety procedures in real-world scenarios

## Key Concepts

### 1. Personal Protective Equipment (PPE)
- Hard hats for head protection
- Safety glasses for eye protection
- Steel-toed boots for foot protection
- High-visibility clothing

### 2. Hazard Identification
- Slip, trip, and fall hazards
- Electrical hazards
- Heavy machinery risks
- Working at height dangers

### 3. Safety Procedures
- Pre-work safety checks
- Proper tool usage
- Emergency procedures
- Reporting incidents

## Practical Applications
- Conducting daily safety briefings
- Implementing safety checklists
- Responding to emergency situations

## Summary
Construction safety requires constant vigilance and proper training. Always follow established safety procedures and use appropriate PPE.

*Note: This is a mock learning material. In a real implementation, this would be generated by AI based on the uploaded content.*
"""
        
        elif content_type == "lesson_plan":
            content = f"""
# Lesson Plan: Construction Safety Training

## Lesson Information
- **Duration**: 2 hours
- **Target Audience**: Construction workers
- **Prerequisites**: Basic construction experience

## Learning Objectives
By the end of this lesson, students will be able to:
1. Identify common construction hazards
2. Demonstrate proper PPE usage
3. Apply safety procedures in practice

## Materials Needed
- Safety equipment samples
- Visual aids and diagrams
- Safety checklists
- Video presentations

## Lesson Structure

### Introduction (15 minutes)
- Welcome and introductions
- Overview of lesson objectives
- Safety briefing

### Main Content (90 minutes)
1. **Hazard Identification** (30 minutes)
   - Group discussion of common hazards
   - Visual identification exercises
   - Case study analysis

2. **PPE Demonstration** (30 minutes)
   - Proper fitting and usage
   - Hands-on practice
   - Maintenance and care

3. **Safety Procedures** (30 minutes)
   - Step-by-step procedures
   - Role-playing exercises
   - Emergency response practice

### Assessment (15 minutes)
- Quick knowledge check
- Practical demonstration
- Q&A session

## Key Points to Emphasize
- Safety is everyone's responsibility
- Prevention is better than cure
- Report all incidents immediately

*Note: This is a mock lesson plan. In a real implementation, this would be generated by AI based on the uploaded content.*
"""
        
        elif content_type == "knowledge_test":
            content = json.dumps({
                "questions": [
                    {
                        "id": 1,
                        "question": "What is the primary purpose of wearing a hard hat on a construction site?",
                        "options": [
                            "To look professional",
                            "To protect against head injuries",
                            "To keep hair clean",
                            "To comply with fashion trends"
                        ],
                        "correct_answer": "B",
                        "explanation": "Hard hats are designed to protect against head injuries from falling objects and impacts."
                    },
                    {
                        "id": 2,
                        "question": "Which of the following is NOT a common construction hazard?",
                        "options": [
                            "Slip and trip hazards",
                            "Electrical hazards",
                            "Heavy machinery risks",
                            "Office paperwork"
                        ],
                        "correct_answer": "D",
                        "explanation": "Office paperwork is not a physical hazard on construction sites, unlike the other options."
                    },
                    {
                        "id": 3,
                        "question": "What should you do if you notice a safety hazard on site?",
                        "options": [
                            "Ignore it if it's not your area",
                            "Report it immediately to your supervisor",
                            "Fix it yourself without telling anyone",
                            "Wait for someone else to notice it"
                        ],
                        "correct_answer": "B",
                        "explanation": "All safety hazards should be reported immediately to ensure proper handling and prevent accidents."
                    }
                ]
            })
        
        return {
            "content": content,
            "content_type": content_type,
            "generated_at": datetime.now().isoformat(),
            "ai_model": "mock_generator",
            "status": "success",
            "note": "Mock content generated due to AI service unavailability" + (f" (Error: {error})" if error else "")
        }
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            import PyPDF2
            
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
                
                return text
                
        except ImportError:
            return "PDF text extraction not available. Please install PyPDF2."
        except Exception as e:
            return f"Error extracting PDF text: {str(e)}"
    
    def process_content_for_ai(self, content: Any) -> str:
        """Process various content types for AI generation"""
        
        if isinstance(content, str):
            return content
        elif hasattr(content, 'file_path') and content.file_path:
            # Extract text from PDF
            return self.extract_text_from_pdf(content.file_path)
        else:
            return str(content)
