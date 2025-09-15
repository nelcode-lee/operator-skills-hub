#!/usr/bin/env python3
"""
Test script to verify AWS S3 credentials and connection.
Run this script to test your AWS setup before deploying.
"""
import os
import sys
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

def test_aws_credentials():
    """Test AWS credentials and S3 connection."""
    print("🔍 Testing AWS S3 Credentials...")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Get credentials from environment
    aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_region = os.getenv("AWS_REGION", "us-east-1")
    bucket_name = os.getenv("S3_BUCKET_NAME", "operator-skills-hub-content")
    
    print(f"📍 Region: {aws_region}")
    print(f"🪣 Bucket: {bucket_name}")
    print(f"🔑 Access Key: {aws_access_key[:10]}..." if aws_access_key else "❌ Not set")
    print(f"🔐 Secret Key: {'✅ Set' if aws_secret_key else '❌ Not set'}")
    print()
    
    # Check if credentials are set
    if not aws_access_key or not aws_secret_key:
        print("❌ ERROR: AWS credentials not found!")
        print("Please set the following environment variables:")
        print("  AWS_ACCESS_KEY_ID=your_access_key")
        print("  AWS_SECRET_ACCESS_KEY=your_secret_key")
        print("  AWS_REGION=us-east-1")
        print("  S3_BUCKET_NAME=your_bucket_name")
        return False
    
    try:
        # Create S3 client
        print("🔌 Creating S3 client...")
        s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        )
        print("✅ S3 client created successfully")
        
        # Test 1: List buckets
        print("\n📋 Testing: List S3 buckets...")
        try:
            response = s3_client.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            print(f"✅ Found {len(buckets)} buckets:")
            for bucket in buckets:
                print(f"   - {bucket}")
        except Exception as e:
            print(f"❌ Failed to list buckets: {e}")
            return False
        
        # Test 2: Check if target bucket exists
        print(f"\n🪣 Testing: Check if bucket '{bucket_name}' exists...")
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' exists and is accessible")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"❌ Bucket '{bucket_name}' not found!")
                print("Please create the bucket in AWS S3 console first.")
                return False
            elif error_code == '403':
                print(f"❌ Access denied to bucket '{bucket_name}'!")
                print("Please check your IAM permissions.")
                return False
            else:
                print(f"❌ Error accessing bucket: {e}")
                return False
        
        # Test 3: Test file operations
        print(f"\n📁 Testing: File operations on bucket '{bucket_name}'...")
        test_key = "test/credentials-test.txt"
        test_content = "This is a test file created by the credentials test script."
        
        try:
            # Upload test file
            print("   📤 Uploading test file...")
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ContentType='text/plain'
            )
            print("   ✅ Test file uploaded successfully")
            
            # Download test file
            print("   📥 Downloading test file...")
            response = s3_client.get_object(Bucket=bucket_name, Key=test_key)
            downloaded_content = response['Body'].read().decode('utf-8')
            if downloaded_content == test_content:
                print("   ✅ Test file downloaded and verified")
            else:
                print("   ❌ Downloaded content doesn't match!")
                return False
            
            # Delete test file
            print("   🗑️ Cleaning up test file...")
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            print("   ✅ Test file deleted successfully")
            
        except Exception as e:
            print(f"   ❌ File operations failed: {e}")
            return False
        
        # Test 4: Generate presigned URL
        print(f"\n🔗 Testing: Generate presigned URL...")
        try:
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket_name, 'Key': test_key},
                ExpiresIn=3600
            )
            print("   ✅ Presigned URL generated successfully")
            print(f"   📎 URL: {url[:50]}...")
        except Exception as e:
            print(f"   ❌ Presigned URL generation failed: {e}")
            return False
        
        print("\n" + "=" * 50)
        print("🎉 ALL TESTS PASSED! Your AWS S3 setup is working correctly.")
        print("✅ You can now deploy your application with confidence.")
        return True
        
    except NoCredentialsError:
        print("❌ ERROR: AWS credentials not found!")
        print("Please check your environment variables.")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Main function."""
    print("🚀 AWS S3 Credentials Test")
    print("This script will test your AWS S3 setup")
    print()
    
    success = test_aws_credentials()
    
    if success:
        print("\n🎯 Next Steps:")
        print("1. Deploy your application to Render")
        print("2. Add the same environment variables to Render")
        print("3. Test the S3 endpoints in your deployed app")
        sys.exit(0)
    else:
        print("\n🔧 Troubleshooting:")
        print("1. Check your AWS credentials are correct")
        print("2. Verify the S3 bucket exists")
        print("3. Ensure your IAM user has S3 permissions")
        print("4. Check your AWS region is correct")
        sys.exit(1)

if __name__ == "__main__":
    main()
