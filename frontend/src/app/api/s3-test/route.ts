import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check AWS credentials
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsRegion = process.env.AWS_REGION;
    const s3BucketName = process.env.S3_BUCKET_NAME;

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !s3BucketName) {
      return NextResponse.json({
        status: 'error',
        message: 'AWS credentials not configured',
        aws_access_key_id: awsAccessKeyId ? '✅ Set' : '❌ Not set',
        aws_secret_access_key: awsSecretAccessKey ? '✅ Set' : '❌ Not set',
        aws_region: awsRegion || 'Not set',
        s3_bucket_name: s3BucketName || 'Not set'
      });
    }

    // For now, just return that credentials are available
    // In a real implementation, you'd test the actual S3 connection
    return NextResponse.json({
      status: 'success',
      message: 'AWS credentials configured',
      aws_access_key_id: '✅ Set',
      aws_secret_access_key: '✅ Set', 
      aws_region: awsRegion,
      s3_bucket_name: s3BucketName,
      note: 'S3 connection test would be implemented here'
    });

  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'S3 test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
