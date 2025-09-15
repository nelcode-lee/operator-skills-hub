import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'operatorskillshub';

export class S3Service {
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    file: File,
    key: string,
    contentType?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType || file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);
      
      return {
        success: true,
        url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Generate a presigned URL for file access
   */
  static async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });
      
      return {
        success: true,
        url,
      };
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate URL',
      };
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      
      return { success: true };
    } catch (error) {
      console.error('S3 delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * List files in S3 with optional prefix
   */
  static async listFiles(prefix: string = ''): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);
      
      return {
        success: true,
        files: response.Contents || [],
      };
    } catch (error) {
      console.error('S3 list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'List failed',
      };
    }
  }

  /**
   * Check if S3 is properly configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.S3_BUCKET_NAME
    );
  }
}
