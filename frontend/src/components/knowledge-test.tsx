"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  Trophy,
  AlertCircle
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correct_answer?: any;
  points: number;
  explanation?: string;
}

interface KnowledgeTestProps {
  assessmentId: number;
  questions: Question[];
  timeLimit: number; // in minutes
  onComplete: (results: any) => void;
}

export default function KnowledgeTest({ 
  assessmentId, 
  questions, 
  timeLimit, 
  onComplete 
}: KnowledgeTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;

    setIsSubmitted(true);
    
    try {
      const response = await fetch(`/api/courses/tests/${assessmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          answers: answers
        })
      });

      const result = await response.json();
      setResults(result);
      setShowResults(true);
      onComplete(result);
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  const getQuestionStatus = (index: number) => {
    if (answers[index] !== undefined) {
      return 'answered';
    }
    return 'unanswered';
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return 'text-green-600';
    } else if (score >= passingScore * 0.8) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  if (showResults && results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {results.passed ? (
                <CheckCircle className="h-16 w-16 text-green-600" />
              ) : (
                <XCircle className="h-16 w-16 text-red-600" />
              )}
            </div>
            <CardTitle className={`text-2xl ${getScoreColor(results.score, results.passing_score)}`}>
              {results.passed ? 'Congratulations!' : 'Keep Learning!'}
            </CardTitle>
            <p className="text-gray-600 mt-2">{results.feedback}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className={`text-3xl font-bold ${getScoreColor(results.score, results.passing_score)}`}>
                  {results.score.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Your Score</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-gray-700">
                  {results.passing_score}%
                </div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-gray-700">
                  {Math.floor(results.time_taken / 60)}:{(results.time_taken % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Take Another Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Test</h1>
          <div className="flex items-center space-x-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            <span className={timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
        
        <Progress 
          value={(currentQuestion + 1) / questions.length * 100} 
          className="h-2"
        />
        <p className="text-sm text-gray-600 mt-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </div>

      {/* Question Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              onClick={() => goToQuestion(index)}
              variant={currentQuestion === index ? "default" : "outline"}
              size="sm"
              className={`w-10 h-10 ${
                getQuestionStatus(index) === 'answered' 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : ''
              }`}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {currentQuestion + 1}</span>
            <span className="text-sm font-normal text-gray-500">
              {currentQ.points} point{currentQ.points !== 1 ? 's' : ''}
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <p className="text-lg mb-6">{currentQ.question}</p>
          
          {currentQ.type === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentQ.id]}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
            >
              {currentQ.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          {currentQ.type === 'true_false' && (
            <RadioGroup
              value={answers[currentQ.id]}
              onValueChange={(value) => handleAnswerChange(currentQ.id, value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="text-base">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="text-base">False</Label>
              </div>
            </RadioGroup>
          )}
          
          {currentQ.type === 'essay' && (
            <Textarea
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
              placeholder="Enter your answer here..."
              className="min-h-[200px]"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          variant="outline"
        >
          Previous
        </Button>
        
        <div className="flex space-x-2">
          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitted}
              className="bg-green-600 hover:bg-green-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Submit Test
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              variant="outline"
            >
              Next
            </Button>
          )}
        </div>
      </div>

      {/* Time Warning */}
      {timeRemaining < 300 && timeRemaining > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              Less than 5 minutes remaining!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

