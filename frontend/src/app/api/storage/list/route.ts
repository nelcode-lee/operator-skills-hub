import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    // Check if S3 is configured
    if (!S3Service.isConfigured()) {
      return NextResponse.json(
        { error: 'S3 not configured. Please set AWS environment variables.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';

    // List files from S3
    const result = await S3Service.listFiles(prefix);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list files' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: result.files?.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        etag: file.ETag,
      })) || [],
    });

  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
