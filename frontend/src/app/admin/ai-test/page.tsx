"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIContentGenerator } from '@/components/ai-content-generator';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export default function AITestPage() {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAIStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setAiStatus(data);
    } catch (error) {
      console.error('AI status test error:', error);
      setAiStatus({
        status: 'error',
        message: 'Failed to check AI status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testContentGeneration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content_type: 'learning_material',
          title: 'Test AI Content Generation',
          description: 'Testing the AI content generation functionality',
          difficulty_level: 'intermediate'
        })
      });

      const result = await response.json();
      console.log('Content generation test result:', result);
      alert(result.success ? 'Content generation test successful!' : `Test failed: ${result.error}`);
    } catch (error) {
      console.error('Content generation test error:', error);
      alert('Content generation test failed');
    }
  };

  const testKnowledgeTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: 'This is a test content for knowledge test generation. It covers safety procedures, equipment operation, and quality control standards.',
          question_count: 3,
          difficulty_level: 'medium'
        })
      });

      const result = await response.json();
      console.log('Knowledge test generation result:', result);
      alert(result.success ? 'Knowledge test generation successful!' : `Test failed: ${result.error}`);
    } catch (error) {
      console.error('Knowledge test generation error:', error);
      alert('Knowledge test generation failed');
    }
  };

  useEffect(() => {
    testAIStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'not_configured':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'configured':
        return <Badge variant="default" className="bg-green-500">Ready</Badge>;
      case 'not_configured':
        return <Badge variant="destructive">Not Configured</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          AI Features Test
        </h1>
        <Button 
          onClick={testAIStatus} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* AI Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {aiStatus && getStatusIcon(aiStatus.status)}
            AI Services Status
            {aiStatus && getStatusBadge(aiStatus.status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-lg">{aiStatus.message}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">OpenAI Configured</p>
                  <p className="text-lg">{aiStatus.openai_configured ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
              
              {aiStatus.features && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Available Features</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(aiStatus.features).map(([feature, enabled]) => (
                      <Badge 
                        key={feature} 
                        variant={enabled ? "default" : "secondary"}
                        className={enabled ? "bg-green-500" : ""}
                      >
                        {feature.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {aiStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {aiStatus.error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* API Tests */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={testContentGeneration}
              className="w-full justify-start"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Test Content Generation
            </Button>
            <Button 
              variant="outline" 
              onClick={testKnowledgeTest}
              className="w-full justify-start"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Test Knowledge Test Generation
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/ai/status', '_blank')}
              className="w-full justify-start"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Check AI Status API
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Content Generator */}
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <AIContentGenerator
            onContentGenerated={(content) => {
              console.log('Content generated:', content);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
