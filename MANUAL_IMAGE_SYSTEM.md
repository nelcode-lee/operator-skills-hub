# Manual Image System for Course Content

## Overview

Instead of trying to automatically extract images from PDFs (which can be complex and unreliable), we've implemented a simple manual image system that allows instructors to easily add relevant images to course content.

## How It Works

### 1. **Simple Image Management**
- Images are stored in `/frontend/public/images/` directory
- Course images are organized by category (courses, equipment, facilities, etc.)
- Images are referenced by simple paths like `/images/courses/plant-training.jpg`

### 2. **Automatic Image Display**
- Images are automatically displayed based on the current page of course content
- Each page can have multiple relevant images
- Images are displayed in a responsive grid layout

### 3. **Easy to Add New Images**
- Simply add image files to the appropriate directory in `/frontend/public/images/`
- Update the image mapping in the frontend code
- Images are immediately available

## Current Image Structure

```
frontend/public/images/
├── courses/           # Course-specific images
│   ├── plant-training.jpg
│   ├── H&S.jpg
│   └── ...
├── equipment/         # Equipment and machinery images
│   ├── excavator-training.jpg
│   ├── crane-operation.jpg
│   └── ...
├── facilities/        # Training facility images
│   ├── training-hall.jpg
│   ├── simulator-room.jpg
│   └── ...
└── testimonials/      # Student testimonial images
    ├── phil.jpg
    ├── chris.jpg
    └── ...
```

## Adding Images to Course Content

### Method 1: Direct File Addition
1. Add your image file to the appropriate directory in `/frontend/public/images/`
2. Update the image mapping in `/frontend/src/app/learning/[courseId]/page.tsx`
3. Add the image path and alt text to the `defaultImages` object

### Method 2: Using the API (Future Enhancement)
- Use the course images API endpoints to manage images dynamically
- Instructors can add/remove images through the web interface
- Images are stored in the database and managed per course

## API Endpoints

The system includes API endpoints for managing course images:

- `GET /api/courses/{course_id}/images` - Get images for a course
- `POST /api/courses/{course_id}/images` - Add an image to a course (instructor only)
- `PUT /api/courses/{course_id}/images/{image_id}` - Update an image (instructor only)
- `DELETE /api/courses/{course_id}/images/{image_id}` - Delete an image (instructor only)

## Benefits of This Approach

1. **Simplicity**: No complex PDF parsing or image extraction
2. **Reliability**: Images always load correctly
3. **Flexibility**: Easy to add, remove, or change images
4. **Performance**: Images are served directly from the frontend
5. **Maintainability**: Clear organization and easy to understand

## Example Usage

```typescript
// In the course content component
const defaultImages = {
  1: [
    { src: '/images/courses/plant-training.jpg', alt: 'Plant Training Overview' },
    { src: '/images/equipment/excavator-training.jpg', alt: 'Excavator Training' }
  ],
  2: [
    { src: '/images/courses/plant-training.jpg', alt: 'Forward Tipping Dumper Training' },
    { src: '/images/equipment/safety-gear.jpg', alt: 'Safety Equipment' }
  ]
  // ... more pages
};
```

## Future Enhancements

1. **Image Management UI**: A web interface for instructors to manage images
2. **Image Categories**: Better organization of images by type and course
3. **Image Optimization**: Automatic resizing and optimization
4. **Image Search**: Search and filter images by tags or categories
5. **Bulk Upload**: Upload multiple images at once

This approach provides a much more reliable and maintainable solution for displaying images in course content.


