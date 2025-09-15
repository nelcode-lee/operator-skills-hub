"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/file-upload';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function S3TestPage() {
  const [s3Status, setS3Status] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testS3Connection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/s3-test');
      const data = await response.json();
      setS3Status(data);
    } catch (error) {
      console.error('S3 test error:', error);
      setS3Status({
        status: 'error',
        message: 'Failed to test S3 connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch('/api/storage/health');
      const data = await response.json();
      console.log('S3 Health Check:', data);
    } catch (error) {
      console.error('Health check error:', error);
    }
  };

  useEffect(() => {
    testS3Connection();
    testHealthCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">S3 Storage Test</h1>
        <Button 
          onClick={testS3Connection} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* S3 Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {s3Status && getStatusIcon(s3Status.status)}
            S3 Connection Status
            {s3Status && getStatusBadge(s3Status.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {s3Status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg">{s3Status.message}</p>
                </div>
                {s3Status.file_count !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Files in Bucket</p>
                    <p className="text-lg">{s3Status.file_count}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">AWS Access Key</p>
                  <p className="text-sm">{s3Status.aws_access_key_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">AWS Secret Key</p>
                  <p className="text-sm">{s3Status.aws_secret_access_key}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">AWS Region</p>
                  <p className="text-sm">{s3Status.aws_region}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">S3 Bucket</p>
                  <p className="text-sm">{s3Status.s3_bucket_name}</p>
                </div>
              </div>

              {s3Status.files && s3Status.files.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Sample Files</p>
                  <div className="space-y-1">
                    {s3Status.files.map((file: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600">
                        {file.Key} ({file.Size} bytes)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {s3Status.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {s3Status.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* File Upload Test */}
      <Card>
        <CardHeader>
          <CardTitle>File Upload Test</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            folder="test-uploads"
            onUploadComplete={(fileData) => {
              console.log('Upload completed:', fileData);
              // Refresh S3 status after upload
              setTimeout(() => testS3Connection(), 1000);
            }}
            maxSize={5}
          />
        </CardContent>
      </Card>

      {/* API Endpoints Test */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/s3-test', '_blank')}
            >
              Test S3 Connection
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/storage/health', '_blank')}
            >
              S3 Health Check
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/storage/list', '_blank')}
            >
              List Files
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
