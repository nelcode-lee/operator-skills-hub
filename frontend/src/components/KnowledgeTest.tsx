'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Award, RotateCcw } from 'lucide-react';

interface Question {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

interface KnowledgeTestProps {
  courseId: number;
  contentId: number;
  onComplete?: (score: number, passed: boolean) => void;
}

export default function KnowledgeTest({ courseId, contentId, onComplete }: KnowledgeTestProps) {
  const [test, setTest] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateTest();
  }, [courseId, contentId]);

  useEffect(() => {
    if (test && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && test && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, test, isSubmitted]);

  const generateTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/course-management/${courseId}/content/${contentId}/create-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_count: 5,
          passing_score: 70,
          time_limit: 15
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate test');
      }

      const data = await response.json();
      setTest(data);
      setTimeLeft(data.time_limit * 60); // Convert minutes to seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const calculateScore = () => {
    if (!test) return 0;
    
    let correct = 0;
    test.questions.forEach((question: Question, index: number) => {
      if (answers[index] === question.correct_answer) {
        correct++;
      }
    });
    
    return Math.round((correct / test.questions.length) * 100);
  };

  const handleSubmit = () => {
    if (isSubmitted) return;
    
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
    
    if (onComplete) {
      onComplete(finalScore, finalScore >= test.passing_score);
    }
  };

  const resetTest = () => {
    setTest(null);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(0);
    setIsSubmitted(false);
    setScore(0);
    generateTest();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generating knowledge test...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={generateTest}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!test) return null;

  const currentQ = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{test.title}</CardTitle>
            <CardDescription>{test.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Question {currentQuestion + 1} of {test.questions.length}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent>
        {!isSubmitted ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>
              <RadioGroup
                value={answers[currentQuestion] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                className="space-y-3"
              >
                {Object.entries(currentQ.options).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={`${currentQuestion}-${key}`} />
                    <Label htmlFor={`${currentQuestion}-${key}`} className="flex-1 cursor-pointer">
                      <span className="font-medium mr-2">{key}.</span>
                      {String(value)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              {currentQuestion === test.questions.length - 1 ? (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  Submit Test
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                {score >= test.passing_score ? (
                  <CheckCircle className="h-16 w-16 text-green-600" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {score >= test.passing_score ? 'Congratulations!' : 'Try Again'}
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                You scored {score}% (Passing score: {test.passing_score}%)
              </p>
              <Badge className={score >= test.passing_score ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {score >= test.passing_score ? 'PASSED' : 'FAILED'}
              </Badge>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Review Answers:</h4>
              {test.questions.map((question: Question, index: number) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{question.question}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Your answer: {userAnswer ? `${userAnswer}. ${question.options[userAnswer as keyof typeof question.options]}` : 'Not answered'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Correct answer: {question.correct_answer}. {question.options[question.correct_answer as keyof typeof question.options]}
                        </p>
                        <p className="text-sm text-gray-700 mt-2 italic">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button onClick={resetTest} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake Test
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

