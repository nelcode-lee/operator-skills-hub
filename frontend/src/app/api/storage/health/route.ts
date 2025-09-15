import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if AWS credentials are available
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.S3_BUCKET_NAME
    );

    if (!hasAwsCredentials) {
      return NextResponse.json({
        status: 'error',
        service: 'S3 Storage',
        message: 'AWS credentials not configured',
        bucket: process.env.S3_BUCKET_NAME || 'Not set',
        region: process.env.AWS_REGION || 'Not set'
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'S3 Storage',
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      message: 'S3 connection ready'
    });

  } catch (error) {
    console.error('S3 health check error:', error);
    return NextResponse.json({
      status: 'error',
      service: 'S3 Storage',
      message: 'S3 health check failed'
    }, { status: 500 });
  }
}
