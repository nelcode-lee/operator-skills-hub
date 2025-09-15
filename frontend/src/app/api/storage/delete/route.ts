import { NextRequest, NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    // Check if S3 is configured
    if (!S3Service.isConfigured()) {
      return NextResponse.json(
        { error: 'S3 not configured. Please set AWS environment variables.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    // Delete file from S3
    const result = await S3Service.deleteFile(key);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete file' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
