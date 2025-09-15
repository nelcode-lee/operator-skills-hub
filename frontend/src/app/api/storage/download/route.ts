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
    const key = searchParams.get('key');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const result = await S3Service.getPresignedUrl(key, expiresIn);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: result.url,
      expiresIn,
    });

  } catch (error) {
    console.error('Download URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
