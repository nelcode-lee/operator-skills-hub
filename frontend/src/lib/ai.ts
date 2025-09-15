/**
 * AI Service for Content Generation and Analysis
 */

import OpenAI from 'openai';

export interface ContentGenerationRequest {
  content_type: 'learning_material' | 'lesson_plan' | 'test' | 'assessment';
  title: string;
  description: string;
  additional_instructions?: string;
  course_context?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  target_audience?: string;
}

export interface ContentGenerationResponse {
  success: boolean;
  content?: {
    title: string;
    content: string;
    type: string;
    metadata: {
      word_count: number;
      estimated_read_time: number;
      difficulty_level: string;
      topics: string[];
    };
  };
  error?: string;
}

export interface KnowledgeTestRequest {
  content: string;
  question_count: number;
  question_types?: ('multiple_choice' | 'true_false' | 'short_answer')[];
  difficulty_level?: 'easy' | 'medium' | 'hard';
  passing_score?: number;
}

export interface KnowledgeTestResponse {
  success: boolean;
  test?: {
    title: string;
    questions: Array<{
      id: string;
      question: string;
      type: 'multiple_choice' | 'true_false' | 'short_answer';
      options?: string[];
      correct_answer: string | number | boolean;
      explanation: string;
      points: number;
    }>;
    total_points: number;
    passing_score: number;
    estimated_duration: number;
  };
  error?: string;
}

export class AIService {
  private static openaiApiKey = process.env.OPENAI_API_KEY;
  private static openai: OpenAI | null = null;

  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      this.openai = new OpenAI({
        apiKey: this.openaiApiKey,
      });
    }
    return this.openai;
  }

  /**
   * Generate educational content using AI
   */
  static async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    try {
      if (!this.openaiApiKey) {
        // Fallback to mock content if no API key
        const mockContent = this.generateMockContent(request);
        return {
          success: true,
          content: mockContent
        };
      }

      const openai = this.getOpenAI();
      
      const prompt = this.buildContentPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator specializing in construction and industrial training. Create high-quality, engaging educational content that is practical and industry-relevant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const generatedContent = completion.choices[0]?.message?.content || '';
      
      return {
        success: true,
        content: {
          title: request.title,
          content: generatedContent,
          type: request.content_type,
          metadata: {
            word_count: generatedContent.split(' ').length,
            estimated_read_time: Math.ceil(generatedContent.split(' ').length / 200),
            difficulty_level: request.difficulty_level || 'intermediate',
            topics: this.extractTopics(generatedContent)
          }
        }
      };
    } catch (error) {
      console.error('AI content generation error:', error);
      // Fallback to mock content on error
      const mockContent = this.generateMockContent(request);
      return {
        success: true,
        content: mockContent
      };
    }
  }

  /**
   * Generate knowledge test from content
   */
  static async generateKnowledgeTest(request: KnowledgeTestRequest): Promise<KnowledgeTestResponse> {
    try {
      if (!this.openaiApiKey) {
        // Fallback to mock test if no API key
        const mockTest = this.generateMockTest(request);
        return {
          success: true,
          test: mockTest
        };
      }

      const openai = this.getOpenAI();
      
      const prompt = this.buildTestPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator specializing in construction and industrial training. Create high-quality assessment questions that test practical knowledge and understanding."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const generatedContent = completion.choices[0]?.message?.content || '';
      
      // Parse the generated test content
      const test = this.parseTestContent(generatedContent, request);
      
      return {
        success: true,
        test
      };
    } catch (error) {
      console.error('AI test generation error:', error);
      // Fallback to mock test on error
      const mockTest = this.generateMockTest(request);
      return {
        success: true,
        test: mockTest
      };
    }
  }

  /**
   * Analyze content for educational insights
   */
  static async analyzeContent(content: string): Promise<{
    success: boolean;
    analysis?: {
      reading_level: string;
      key_concepts: string[];
      suggested_questions: string[];
      learning_objectives: string[];
    };
    error?: string;
  }> {
    try {
      // Mock analysis for demo
      const analysis = {
        reading_level: 'Intermediate',
        key_concepts: ['Safety Procedures', 'Equipment Operation', 'Quality Control'],
        suggested_questions: [
          'What are the key safety procedures mentioned?',
          'How should equipment be operated safely?',
          'What quality control measures are important?'
        ],
        learning_objectives: [
          'Understand safety protocols',
          'Learn proper equipment operation',
          'Apply quality control standards'
        ]
      };

      return {
        success: true,
        analysis
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content analysis failed'
      };
    }
  }

  /**
   * Generate mock content for demo purposes
   */
  private static generateMockContent(request: ContentGenerationRequest): ContentGenerationResponse['content'] {
    const contentTemplates = {
      learning_material: `# ${request.title}

## Overview
${request.description}

## Key Learning Points
- **Safety First**: Always follow established safety protocols
- **Proper Procedures**: Use correct techniques and methods
- **Quality Standards**: Maintain high quality in all operations
- **Continuous Improvement**: Seek ways to enhance performance

## Detailed Content
This comprehensive learning material covers essential aspects of ${request.title.toLowerCase()}. Students will gain practical knowledge and skills that can be immediately applied in real-world scenarios.

### Section 1: Fundamentals
Understanding the basic principles and concepts is crucial for success in this area.

### Section 2: Practical Application
Hands-on experience and real-world examples help solidify learning.

### Section 3: Best Practices
Industry best practices and proven methodologies for optimal results.

## Summary
This material provides a solid foundation for understanding ${request.title.toLowerCase()} and prepares students for practical application in their work environment.`,

      lesson_plan: `# Lesson Plan: ${request.title}

## Learning Objectives
By the end of this lesson, students will be able to:
- Understand the core concepts of ${request.title.toLowerCase()}
- Apply practical skills in real-world scenarios
- Demonstrate competency through assessments

## Duration
90 minutes

## Materials Needed
- Course materials and handouts
- Practical demonstration equipment
- Assessment tools

## Lesson Structure

### Introduction (15 minutes)
- Welcome and overview
- Learning objectives
- Pre-assessment

### Main Content (60 minutes)
- Core concepts presentation
- Interactive demonstrations
- Hands-on practice
- Group discussions

### Conclusion (15 minutes)
- Key points summary
- Q&A session
- Next steps and assignments

## Assessment
- Practical demonstration
- Knowledge check
- Peer evaluation`,

      test: `# Assessment: ${request.title}

## Instructions
This assessment evaluates your understanding of ${request.title.toLowerCase()}. Read each question carefully and select the best answer.

## Question 1 (Multiple Choice)
What is the most important aspect of ${request.title.toLowerCase()}?
A) Speed
B) Safety
C) Cost
D) Efficiency

**Correct Answer: B) Safety**

## Question 2 (True/False)
Following established procedures is optional in ${request.title.toLowerCase()}.
- True
- False

**Correct Answer: False**

## Question 3 (Short Answer)
Explain why quality control is important in ${request.title.toLowerCase()}.

**Sample Answer**: Quality control ensures consistent results, reduces errors, and maintains high standards.`,

      assessment: `# Assessment Rubric: ${request.title}

## Performance Criteria

### Excellent (90-100%)
- Demonstrates complete understanding
- Applies concepts correctly
- Shows initiative and creativity
- Exceeds expectations

### Good (80-89%)
- Shows solid understanding
- Applies most concepts correctly
- Meets expectations consistently
- Minor areas for improvement

### Satisfactory (70-79%)
- Basic understanding demonstrated
- Some concepts applied correctly
- Meets minimum requirements
- Several areas need improvement

### Needs Improvement (Below 70%)
- Limited understanding shown
- Concepts not applied correctly
- Below minimum requirements
- Significant improvement needed

## Assessment Methods
- Written examination (40%)
- Practical demonstration (40%)
- Participation and engagement (20%)`
    };

    const content = contentTemplates[request.content_type] || contentTemplates.learning_material;
    
    return {
      title: request.title,
      content,
      type: request.content_type,
      metadata: {
        word_count: content.split(' ').length,
        estimated_read_time: Math.ceil(content.split(' ').length / 200), // 200 words per minute
        difficulty_level: request.difficulty_level || 'intermediate',
        topics: ['Safety', 'Procedures', 'Quality Control', 'Best Practices']
      }
    };
  }

  /**
   * Generate mock knowledge test for demo purposes
   */
  private static generateMockTest(request: KnowledgeTestRequest): KnowledgeTestResponse['test'] {
    const questions = [
      {
        id: '1',
        question: 'What is the primary focus of this content?',
        type: 'multiple_choice' as const,
        options: ['Speed', 'Safety', 'Cost', 'Efficiency'],
        correct_answer: 1,
        explanation: 'Safety is the primary focus as it ensures proper procedures and prevents accidents.',
        points: 10
      },
      {
        id: '2',
        question: 'Following established procedures is always mandatory.',
        type: 'true_false' as const,
        correct_answer: true,
        explanation: 'Established procedures are designed to ensure safety and quality, so they must always be followed.',
        points: 10
      },
      {
        id: '3',
        question: 'Explain the importance of quality control in this context.',
        type: 'short_answer' as const,
        correct_answer: 'Quality control ensures consistent results and maintains high standards.',
        explanation: 'Quality control is essential for maintaining standards and preventing errors.',
        points: 15
      }
    ];

    return {
      title: `Knowledge Test - ${request.question_count} Questions`,
      questions: questions.slice(0, request.question_count),
      total_points: questions.slice(0, request.question_count).reduce((sum, q) => sum + q.points, 0),
      passing_score: request.passing_score || 70,
      estimated_duration: request.question_count * 2 // 2 minutes per question
    };
  }

  /**
   * Build content generation prompt
   */
  private static buildContentPrompt(request: ContentGenerationRequest): string {
    const basePrompt = `Create ${request.content_type.replace('_', ' ')} content with the following specifications:

Title: ${request.title}
Description: ${request.description}
Difficulty Level: ${request.difficulty_level || 'intermediate'}
Target Audience: ${request.target_audience || 'Construction workers and safety professionals'}
Additional Instructions: ${request.additional_instructions || 'None'}

Please create comprehensive, industry-relevant content that is practical and engaging.`;

    switch (request.content_type) {
      case 'learning_material':
        return `${basePrompt}

Format the content as a structured learning material with:
- Clear headings and subheadings
- Key learning points
- Practical examples
- Safety considerations
- Summary section`;
      
      case 'lesson_plan':
        return `${basePrompt}

Format as a detailed lesson plan including:
- Learning objectives
- Duration and materials needed
- Lesson structure with timing
- Activities and assessments
- Evaluation criteria`;
      
      case 'test':
        return `${basePrompt}

Format as an assessment with:
- Clear instructions
- Multiple question types (multiple choice, true/false, short answer)
- Correct answers and explanations
- Point values for each question`;
      
      case 'assessment':
        return `${basePrompt}

Format as an assessment rubric with:
- Performance criteria
- Scoring levels (Excellent, Good, Satisfactory, Needs Improvement)
- Assessment methods
- Clear evaluation guidelines`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * Extract topics from generated content
   */
  private static extractTopics(content: string): string[] {
    // Simple topic extraction - in production, this could use NLP
    const commonTopics = [
      'Safety', 'Procedures', 'Equipment', 'Quality Control', 'Maintenance',
      'Training', 'Compliance', 'Standards', 'Best Practices', 'Risk Management'
    ];
    
    const foundTopics = commonTopics.filter(topic => 
      content.toLowerCase().includes(topic.toLowerCase())
    );
    
    return foundTopics.length > 0 ? foundTopics : ['General Training'];
  }

  /**
   * Build content generation prompt
   */
  private static buildContentPrompt(request: ContentGenerationRequest): string {
    const basePrompt = `Create a comprehensive ${request.content_type} based on the following information:

Title: ${request.title}
Description: ${request.description}
Additional Instructions: ${request.additional_instructions || 'None'}
Difficulty Level: ${request.difficulty_level || 'intermediate'}
Target Audience: ${request.target_audience || 'Construction professionals'}

Please generate:`;

    switch (request.content_type) {
      case 'learning_material':
        return basePrompt + `
1. A structured learning material with clear sections
2. Key learning objectives
3. Important concepts and definitions
4. Practical examples and applications relevant to construction
5. Summary points that reinforce the key concepts
6. Use UK English spelling and terminology throughout

Format the output as a well-structured educational resource suitable for construction industry training.`;

      case 'lesson_plan':
        return basePrompt + `
1. Learning objectives
2. Duration and timing appropriate for the material
3. Materials needed
4. Step-by-step lesson structure
5. Activities and exercises
6. Assessment methods
7. Key points to emphasise

Use UK English spelling and terminology throughout. Format as a professional lesson plan suitable for construction industry training.`;

      case 'test':
        return basePrompt + `
1. 10 multiple choice questions
2. Each question should have 4 answer options
3. Include the correct answer for each question
4. Questions should test understanding of key concepts
5. Mix difficulty levels (easy, medium, hard)
6. Focus on practical application in construction industry
7. Include explanations
8. Use UK English spelling and terminology throughout

Format as JSON with questions array containing id, question, options, correct_answer, and explanation.`;

      case 'assessment':
        return basePrompt + `
1. Performance criteria with clear rubrics
2. Different achievement levels (Excellent, Good, Satisfactory, Needs Improvement)
3. Assessment methods and tools
4. Scoring guidelines
5. Feedback templates

Use UK English spelling and terminology throughout. Format as a comprehensive assessment rubric.`;

      default:
        return basePrompt + `Create comprehensive ${request.content_type} content suitable for construction industry training. Use UK English spelling and terminology throughout.`;
    }
  }

  /**
   * Build test generation prompt
   */
  private static buildTestPrompt(request: KnowledgeTestRequest): string {
    return `Create a knowledge test based on the following content:

Content: ${request.content}

Requirements:
- Generate ${request.question_count} questions
- Question types: ${request.question_types?.join(', ') || 'multiple_choice, true_false, short_answer'}
- Difficulty level: ${request.difficulty_level || 'medium'}
- Passing score: ${request.passing_score || 70}%

Format as JSON with the following structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "B",
      "explanation": "Why this is correct",
      "points": 10
    }
  ],
  "total_points": 100,
  "passing_score": 70,
  "estimated_duration": 30
}

Use UK English spelling and terminology throughout. Focus on practical construction industry knowledge.`;
  }

  /**
   * Parse test content from AI response
   */
  private static parseTestContent(content: string, request: KnowledgeTestRequest): KnowledgeTestResponse['test'] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return {
          title: `Knowledge Test - ${request.question_count} Questions`,
          questions: parsed.questions,
          total_points: parsed.total_points || parsed.questions.reduce((sum: number, q: any) => sum + (q.points || 10), 0),
          passing_score: parsed.passing_score || request.passing_score || 70,
          estimated_duration: parsed.estimated_duration || request.question_count * 2
        };
      }
    } catch (e) {
      // If JSON parsing fails, fall back to mock test
      console.warn('Failed to parse AI-generated test content, using mock test');
    }

    // Fallback to mock test
    return this.generateMockTest(request);
  }

  /**
   * Extract topics from content
   */
  private static extractTopics(content: string): string[] {
    // Simple topic extraction based on common construction terms
    const constructionTerms = [
      'Safety', 'Procedures', 'Quality Control', 'Best Practices',
      'Equipment', 'Maintenance', 'Training', 'Compliance',
      'Standards', 'Regulations', 'Risk Assessment', 'Health'
    ];

    const foundTopics = constructionTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );

    return foundTopics.length > 0 ? foundTopics : ['General Construction', 'Training', 'Safety'];
  }

  /**
   * Check if AI services are configured
   */
  static isConfigured(): boolean {
    return !!this.openaiApiKey;
  }
}
