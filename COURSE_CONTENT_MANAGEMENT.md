# Course Content Management System

## Overview
The Operator Skills Hub now includes comprehensive course content management functionality that allows instructors to upload materials and generate various educational content types using AI.

## Features

### 1. Course Content Display
- **Fixed Issue**: Course content is now properly displayed in the "Manage Courses" section
- **Content Types**: Supports PDFs, learning materials, lesson plans, and knowledge tests
- **Visual Interface**: Clean, card-based layout showing content details and metadata

### 2. Content Upload & Management
- **PDF Upload**: Upload PDF course materials with title and description
- **Content Organization**: Content is organized by course with proper categorization
- **File Metadata**: Tracks file size, page count, and creation timestamps

### 3. AI-Powered Content Generation
- **Learning Materials**: Generate structured learning materials from uploaded PDFs
- **Lesson Plans**: Create detailed lesson plans with objectives, activities, and assessments
- **Knowledge Tests**: Generate multiple-choice questions and tests from course content

### 4. Content Tweaking System
- **Smart Generation**: Use AI to transform uploaded content into different educational formats
- **Custom Instructions**: Add specific requirements and instructions for content generation
- **Multiple Outputs**: Generate multiple content types from the same source material

## How to Use

### For Instructors

1. **Upload Content**:
   - Navigate to the Instructor Dashboard
   - Select a course or create a new one
   - Click "Upload Content" to add PDF materials

2. **View Course Content**:
   - Select a course to manage
   - View all uploaded content in the "Course Content" section
   - Click "View All Content" for a detailed overview

3. **Generate New Content**:
   - Click "Tweak" on any PDF content
   - Choose content type (Learning Material, Lesson Plan, or Test)
   - Add custom instructions if needed
   - Click "Generate" to create new content

4. **View Generated Content**:
   - Generated content appears in the course content list
   - Click "View Content" to see the AI-generated material
   - Content is formatted and ready for use

### Content Types

#### Learning Materials
- Structured educational content
- Key concepts and definitions
- Practical examples and applications
- Summary points and objectives

#### Lesson Plans
- Detailed teaching structure
- Learning objectives and timing
- Materials and activities
- Assessment methods

#### Knowledge Tests
- Multiple-choice questions
- Various difficulty levels
- Answer explanations
- Practical application focus

## Technical Implementation

### Backend API Endpoints
- `POST /api/courses/{course_id}/content/{content_id}/tweak` - Generate new content
- `GET /api/courses/{course_id}/content/{content_id}/generated-content` - View generated content
- `GET /api/courses/{course_id}/content` - List course content

### AI Integration
- **OpenAI Integration**: Uses GPT-3.5-turbo for content generation
- **Fallback System**: Mock content generation when AI service is unavailable
- **PDF Processing**: Extracts text from uploaded PDFs for AI processing

### Database Schema
- `CourseFileContent` model stores all content types
- Metadata field stores AI generation details
- Tracks relationships between original and generated content

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Dependencies
- `requests` - For OpenAI API calls
- `PyPDF2` - For PDF text extraction (optional)

## Future Enhancements

1. **Advanced AI Models**: Integration with more sophisticated AI models
2. **Content Templates**: Pre-defined templates for different content types
3. **Batch Processing**: Generate multiple content types simultaneously
4. **Content Export**: Export generated content in various formats
5. **Collaborative Editing**: Multiple instructors working on content

## Troubleshooting

### Common Issues

1. **Content Not Displaying**: Ensure the course is selected and content is uploaded
2. **AI Generation Failing**: Check API key configuration and network connectivity
3. **PDF Processing Issues**: Verify PDF file is not corrupted or password-protected

### Support
For technical support or feature requests, please contact the development team.

---

*This system enhances the Operator Skills Hub by providing powerful content creation tools that help instructors develop comprehensive educational materials efficiently.*
