"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Sparkles, 
  Target, 
  BarChart3, 
  Lightbulb, 
  Users, 
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface InstructorAIWorkflowProps {
  courseId?: string;
  contentId?: string;
}

export function InstructorAIWorkflow({ courseId, contentId }: InstructorAIWorkflowProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [content, setContent] = useState('');

  const handleAIWorkflow = async (action: string, data: any = {}) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/instructor-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          course_id: courseId,
          content_id: contentId,
          data: { ...data, content }
        })
      });

      const result = await response.json();
      if (result.success) {
        setResults({ action, data: result.data });
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('AI workflow error:', error);
      alert('AI workflow failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const workflowActions = [
    {
      id: 'optimize_content',
      title: 'Optimize Content',
      description: 'AI-powered content optimization and enhancement',
      icon: Sparkles,
      color: 'text-purple-500'
    },
    {
      id: 'generate_questions',
      title: 'Generate Questions',
      description: 'Create assessment questions from content',
      icon: Target,
      color: 'text-blue-500'
    },
    {
      id: 'analyze_student_progress',
      title: 'Analyze Progress',
      description: 'Get insights on student performance',
      icon: BarChart3,
      color: 'text-green-500'
    },
    {
      id: 'suggest_improvements',
      title: 'Suggest Improvements',
      description: 'Get recommendations for course enhancement',
      icon: Lightbulb,
      color: 'text-yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Instructor AI Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content Tools</TabsTrigger>
              <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Content to Analyze</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your course content here for AI analysis and optimization..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowActions.slice(0, 2).map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Card key={action.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-6 w-6 ${action.color} mt-1`} />
                          <div className="flex-1">
                            <h3 className="font-semibold">{action.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                            <Button
                              size="sm"
                              onClick={() => handleAIWorkflow(action.id)}
                              disabled={isProcessing || !content.trim()}
                              className="w-full"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Run Analysis'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowActions.slice(2).map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Card key={action.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <IconComponent className={`h-6 w-6 ${action.color} mt-1`} />
                          <div className="flex-1">
                            <h3 className="font-semibold">{action.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                            <Button
                              size="sm"
                              onClick={() => handleAIWorkflow(action.id)}
                              disabled={isProcessing}
                              className="w-full"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Get Insights'
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.action === 'optimize_content' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Optimized Content:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{results.data.optimized_content}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Suggestions:</h4>
                  <ul className="space-y-1">
                    {results.data.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {results.action === 'generate_questions' && (
              <div className="space-y-4">
                <h4 className="font-semibold">Generated Questions:</h4>
                {results.data.questions.map((question: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Question {index + 1}</span>
                        <Badge variant="outline">{question.type}</Badge>
                      </div>
                      <p>{question.question}</p>
                      {question.options && (
                        <ul className="ml-4 space-y-1">
                          {question.options.map((option: string, optIndex: number) => (
                            <li key={optIndex} className="text-sm">
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2">
                        <Badge variant="secondary">{question.points} points</Badge>
                        <Badge variant="outline">{question.difficulty}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {results.action === 'analyze_student_progress' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.data.total_students}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.data.completion_rate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{results.data.average_score}</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.data.struggling_students}</div>
                    <div className="text-sm text-gray-600">Struggling</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {results.data.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {results.action === 'suggest_improvements' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-2xl font-bold">{results.data.overall_score}/10</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <Badge variant={results.data.improvement_potential === 'high' ? 'default' : 'secondary'}>
                    {results.data.improvement_potential} potential
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Improvement Suggestions:</h4>
                  {results.data.suggestions.map((suggestion: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{suggestion.description}</span>
                          <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{suggestion.impact}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}