import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    // Check if S3 is configured
    if (!S3Service.isConfigured()) {
      return NextResponse.json(
        { error: 'S3 not configured. Please set AWS environment variables.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const courseId = formData.get('courseId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create S3 key
    let s3Key = `${folder}/${fileName}`;
    if (courseId) {
      s3Key = `courses/${courseId}/${folder}/${fileName}`;
    }

    // Upload to S3
    const result = await S3Service.uploadFile(file, s3Key, file.type);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        key: s3Key,
        url: result.url,
        fileName: file.name,
        size: file.size,
        type: file.type,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
