import { NextResponse } from 'next/server';
import { S3Service } from '@/lib/s3';

export async function GET() {
  try {
    // Check if S3 is configured
    if (!S3Service.isConfigured()) {
      return NextResponse.json({
        status: 'error',
        message: 'AWS credentials not configured',
        aws_access_key_id: process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set',
        aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set',
        aws_region: process.env.AWS_REGION || 'Not set',
        s3_bucket_name: process.env.S3_BUCKET_NAME || 'Not set'
      });
    }

    // Test S3 connection by listing files
    const result = await S3Service.listFiles('');
    
    if (result.success) {
      return NextResponse.json({
        status: 'success',
        message: 'S3 connection working',
        aws_access_key_id: '✅ Set',
        aws_secret_access_key: '✅ Set', 
        aws_region: process.env.AWS_REGION,
        s3_bucket_name: process.env.S3_BUCKET_NAME,
        file_count: result.files?.length || 0,
        files: result.files?.slice(0, 5) || [] // Show first 5 files
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'S3 connection failed',
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'S3 test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
