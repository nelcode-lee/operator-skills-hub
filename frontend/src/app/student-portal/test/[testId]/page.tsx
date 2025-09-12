"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentKnowledgeTest from '@/components/student-knowledge-test';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Award, 
  BookOpen, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface TestInfo {
  id: number;
  title: string;
  description: string;
  course_id: number;
  course_title: string;
  passing_score: number;
  time_limit_minutes: number;
  total_questions: number;
  attempts_allowed: number;
  attempts_used: number;
  last_attempt?: {
    score: number;
    percentage: number;
    passed: boolean;
    completed_at: string;
  };
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testId) {
      loadTestInfo();
    }
  }, [testId]);

  const loadTestInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/learning/assessments/${testId}/info`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setTestInfo(data);
      } else {
        setError('Failed to load test information');
      }
    } catch (err) {
      setError('Error loading test information');
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setShowTest(true);
  };

  const handleTestComplete = (attempt: any) => {
    // Update test info with new attempt
    if (testInfo) {
      setTestInfo(prev => prev ? {
        ...prev,
        attempts_used: prev.attempts_used + 1,
        last_attempt: {
          score: attempt.score,
          percentage: attempt.percentage,
          passed: attempt.passed,
          completed_at: attempt.completed_at
        }
      } : null);
    }
  };

  const handleTestExit = () => {
    setShowTest(false);
  };

  const canRetake = () => {
    if (!testInfo) return false;
    return testInfo.attempts_allowed === -1 || testInfo.attempts_used < testInfo.attempts_allowed;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test information...</p>
        </div>
      </div>
    );
  }

  if (error || !testInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Test not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (showTest) {
    return (
      <StudentKnowledgeTest
        assessmentId={parseInt(testId)}
        onComplete={handleTestComplete}
        onExit={handleTestExit}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{testInfo.title}</h1>
          <p className="text-gray-600 mt-2">{testInfo.description}</p>
          <p className="text-sm text-gray-500 mt-1">Course: {testInfo.course_title}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          Back to Course
        </Button>
      </div>

      {/* Test Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-blue-600">{testInfo.total_questions}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Limit</p>
                <p className="text-2xl font-bold text-orange-600">{formatTime(testInfo.time_limit_minutes)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Passing Score</p>
                <p className="text-2xl font-bold text-green-600">{testInfo.passing_score}%</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attempts</p>
                <p className="text-2xl font-bold text-purple-600">
                  {testInfo.attempts_allowed === -1 ? '∞' : `${testInfo.attempts_used}/${testInfo.attempts_allowed}`}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Attempt Results */}
      {testInfo.last_attempt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Last Attempt Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${testInfo.last_attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {testInfo.last_attempt.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {testInfo.last_attempt.score}
                  </div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {new Date(testInfo.last_attempt.completed_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
              <Badge className={testInfo.last_attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {testInfo.last_attempt.passed ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Before You Begin:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet environment free from distractions</li>
              <li>Have your course materials ready for reference if allowed</li>
              <li>Read each question carefully before answering</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">During the Test:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>You can navigate between questions using the question numbers</li>
              <li>Your answers are saved automatically as you progress</li>
              <li>Use the timer to manage your time effectively</li>
              <li>Answer all questions before submitting</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Important Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>This test uses UK English spelling and terminology</li>
              <li>Answer options are randomised to prevent guessing patterns</li>
              <li>You must achieve {testInfo.passing_score}% to pass</li>
              <li>Results are final once submitted</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {testInfo.last_attempt && canRetake() && (
          <Button
            onClick={startTest}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Award className="h-4 w-4 mr-2" />
            Retake Test
          </Button>
        )}
        
        {!testInfo.last_attempt && (
          <Button
            onClick={startTest}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Start Test
          </Button>
        )}

        {testInfo.last_attempt && !canRetake() && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You have used all available attempts for this test.</p>
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Back to Course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
