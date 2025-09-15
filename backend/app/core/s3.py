"""
AWS S3 configuration and utilities for course content storage.
"""
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class S3Manager:
    """Manages AWS S3 operations for course content storage."""
    
    def __init__(self):
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.bucket_name = os.getenv("S3_BUCKET_NAME", "operator-skills-hub-content")
        
        # Initialize S3 client
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key,
                region_name=self.aws_region
            )
            self._verify_connection()
        except NoCredentialsError:
            logger.warning("AWS credentials not found. S3 operations will be disabled.")
            self.s3_client = None
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            self.s3_client = None
    
    def _verify_connection(self):
        """Verify S3 connection by checking if bucket exists."""
        if not self.s3_client:
            return False
        
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"S3 connection verified. Using bucket: {self.bucket_name}")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                logger.warning(f"S3 bucket '{self.bucket_name}' not found. Will attempt to create.")
                return self._create_bucket()
            else:
                logger.error(f"S3 connection failed: {e}")
                return False
    
    def _create_bucket(self):
        """Create S3 bucket if it doesn't exist."""
        try:
            if self.aws_region == 'us-east-1':
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            else:
                self.s3_client.create_bucket(
                    Bucket=self.bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': self.aws_region}
                )
            logger.info(f"Created S3 bucket: {self.bucket_name}")
            return True
        except ClientError as e:
            logger.error(f"Failed to create S3 bucket: {e}")
            return False
    
    def upload_file(self, file_path: str, s3_key: str, content_type: str = None) -> Dict[str, Any]:
        """
        Upload a file to S3.
        
        Args:
            file_path: Local file path
            s3_key: S3 object key (path in bucket)
            content_type: MIME type of the file
            
        Returns:
            Dict with upload result
        """
        if not self.s3_client:
            return {"success": False, "error": "S3 client not initialized"}
        
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.upload_file(
                file_path, 
                self.bucket_name, 
                s3_key,
                ExtraArgs=extra_args
            )
            
            # Generate public URL
            url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_key}"
            
            return {
                "success": True,
                "url": url,
                "bucket": self.bucket_name,
                "key": s3_key
            }
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            return {"success": False, "error": str(e)}
    
    def upload_fileobj(self, file_obj, s3_key: str, content_type: str = None) -> Dict[str, Any]:
        """
        Upload a file object to S3.
        
        Args:
            file_obj: File-like object
            s3_key: S3 object key
            content_type: MIME type of the file
            
        Returns:
            Dict with upload result
        """
        if not self.s3_client:
            return {"success": False, "error": "S3 client not initialized"}
        
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            self.s3_client.upload_fileobj(
                file_obj, 
                self.bucket_name, 
                s3_key,
                ExtraArgs=extra_args
            )
            
            url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{s3_key}"
            
            return {
                "success": True,
                "url": url,
                "bucket": self.bucket_name,
                "key": s3_key
            }
        except ClientError as e:
            logger.error(f"Failed to upload file object to S3: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_file(self, s3_key: str) -> Dict[str, Any]:
        """
        Delete a file from S3.
        
        Args:
            s3_key: S3 object key
            
        Returns:
            Dict with deletion result
        """
        if not self.s3_client:
            return {"success": False, "error": "S3 client not initialized"}
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return {"success": True, "key": s3_key}
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return {"success": False, "error": str(e)}
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for private file access.
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if failed
        """
        if not self.s3_client:
            return None
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None
    
    def list_files(self, prefix: str = "") -> Dict[str, Any]:
        """
        List files in S3 bucket with optional prefix.
        
        Args:
            prefix: S3 key prefix to filter files
            
        Returns:
            Dict with list of files
        """
        if not self.s3_client:
            return {"success": False, "error": "S3 client not initialized"}
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    files.append({
                        "key": obj['Key'],
                        "size": obj['Size'],
                        "last_modified": obj['LastModified'].isoformat(),
                        "url": f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{obj['Key']}"
                    })
            
            return {"success": True, "files": files}
        except ClientError as e:
            logger.error(f"Failed to list files in S3: {e}")
            return {"success": False, "error": str(e)}

# Global S3 manager instance
s3_manager = S3Manager()
