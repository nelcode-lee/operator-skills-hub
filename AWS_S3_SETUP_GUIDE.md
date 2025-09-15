# AWS S3 Setup Guide for Operator Skills Hub

This guide will help you set up AWS S3 for storing course content, PDFs, videos, and other materials.

## Prerequisites

1. **AWS Account** - Sign up at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI** (optional but recommended) - Install from [aws.amazon.com/cli](https://aws.amazon.com/cli)

## Step 1: Create AWS IAM User

1. **Go to AWS IAM Console**
   - Navigate to [IAM Console](https://console.aws.amazon.com/iam/)
   - Click "Users" → "Create user"

2. **Create User**
   - Username: `operator-skills-hub-s3`
   - Access type: "Programmatic access"

3. **Attach Policies**
   - Click "Attach existing policies directly"
   - Search and select: `AmazonS3FullAccess`
   - Click "Next" → "Create user"

4. **Save Credentials**
   - **IMPORTANT**: Save the Access Key ID and Secret Access Key
   - You'll need these for the environment variables

## Step 2: Create S3 Bucket

1. **Go to S3 Console**
   - Navigate to [S3 Console](https://console.aws.amazon.com/s3/)
   - Click "Create bucket"

2. **Configure Bucket**
   - Bucket name: `operator-skills-hub-content` (or your preferred name)
   - Region: Choose your preferred region (e.g., `us-east-1`)
   - Uncheck "Block all public access" (we'll use presigned URLs for security)

3. **Bucket Settings**
   - Versioning: Enable (recommended)
   - Server-side encryption: Enable (recommended)
   - Click "Create bucket"

## Step 3: Configure Environment Variables

### For Local Development

1. **Copy the example file:**
   ```bash
   cp backend/s3_config.example backend/.env
   ```

2. **Edit `.env` file:**
   ```env
   AWS_ACCESS_KEY_ID=your_actual_access_key_here
   AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=operator-skills-hub-content
   ```

### For Production (Render)

1. **Go to Render Dashboard**
   - Navigate to your service
   - Go to "Environment" tab

2. **Add Environment Variables:**
   ```
   AWS_ACCESS_KEY_ID=your_actual_access_key_here
   AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=operator-skills-hub-content
   ```

## Step 4: Test S3 Connection

1. **Start your backend:**
   ```bash
   cd backend
   python -m uvicorn app.main_unified:app --reload
   ```

2. **Test S3 health:**
   ```bash
   curl http://localhost:8000/api/storage/health
   ```

3. **Expected response:**
   ```json
   {
     "status": "healthy",
     "service": "S3 Storage",
     "bucket": "operator-skills-hub-content",
     "region": "us-east-1",
     "message": "S3 connection successful"
   }
   ```

## Step 5: Upload Test File

1. **Test file upload:**
   ```bash
   curl -X POST "http://localhost:8000/api/storage/upload" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@test.pdf" \
     -F "folder=courses"
   ```

2. **Expected response:**
   ```json
   {
     "message": "File uploaded successfully",
     "file_info": {
       "original_filename": "test.pdf",
       "s3_key": "courses/2025/01/uuid-filename.pdf",
       "url": "https://operator-skills-hub-content.s3.us-east-1.amazonaws.com/courses/2025/01/uuid-filename.pdf",
       "size": 12345,
       "content_type": "application/pdf",
       "uploaded_by": "admin@example.com",
       "uploaded_at": "2025-01-15T10:30:00"
     }
   }
   ```

## S3 Storage Structure

The system organizes files in the following structure:

```
operator-skills-hub-content/
├── courses/
│   ├── 1/           # Course ID 1
│   │   ├── pdfs/    # PDF documents
│   │   ├── videos/  # Video content
│   │   └── images/  # Images
│   └── 2/           # Course ID 2
├── documents/       # General documents
├── images/          # General images
└── temp/           # Temporary uploads
```

## Security Features

1. **Presigned URLs** - Secure, time-limited access to private files
2. **User Authentication** - Only authenticated users can upload/access files
3. **Folder-based Organization** - Content organized by course and type
4. **Unique Filenames** - UUID-based naming prevents conflicts

## Cost Optimization

1. **S3 Standard** - For frequently accessed content
2. **S3 Intelligent Tiering** - Automatically moves old content to cheaper storage
3. **CloudFront CDN** - (Optional) For faster global content delivery

## Troubleshooting

### Common Issues

1. **"S3 client not initialized"**
   - Check AWS credentials are correct
   - Verify environment variables are set

2. **"Access Denied"**
   - Check IAM user has S3 permissions
   - Verify bucket name is correct

3. **"Bucket not found"**
   - Check bucket name and region
   - Verify bucket exists in AWS console

### Debug Commands

```bash
# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $S3_BUCKET_NAME

# Test AWS CLI (if installed)
aws s3 ls s3://operator-skills-hub-content

# Check backend logs
tail -f logs/app.log
```

## Next Steps

Once S3 is configured:

1. **Upload existing course content** to S3
2. **Update course models** to reference S3 URLs
3. **Implement file management** in the frontend
4. **Set up CloudFront CDN** for better performance (optional)

## Support

If you encounter issues:

1. Check the [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
2. Review the backend logs for error messages
3. Verify all environment variables are set correctly
4. Test with a simple file upload first
