"use client";

import React, { useState, useEffect } from 'react';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award, 
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  randomised_options?: string[]; // For randomized answer order
  correct_answer_index?: number; // Index of correct answer in randomized options
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  course_id: number;
  passing_score: number;
  time_limit_minutes: number;
  total_questions: number;
  questions: Question[];
}

interface TestAttempt {
  id: number;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  time_taken_minutes: number;
}

interface StudentKnowledgeTestProps {
  assessmentId: number;
  onComplete?: (attempt: TestAttempt) => void;
  onExit?: () => void;
}

export default function StudentKnowledgeTest({ 
  assessmentId, 
  onComplete, 
  onExit 
}: StudentKnowledgeTestProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Swipe gestures for mobile navigation
  const swipeGestures = useSwipeGestures({
    onSwipeLeft: () => {
      if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
        handleNext();
      }
    },
    onSwipeRight: () => {
      if (currentQuestionIndex > 0) {
        handlePrevious();
      }
    }
  });

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  useEffect(() => {
    if (assessment && timeRemaining > 0) {
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
    }
  }, [assessment, timeRemaining]);

  const randomizeAnswers = (options: string[], correctAnswer: string) => {
    // Create array of indices
    const indices = Array.from({ length: options.length }, (_, i) => i);
    
    // Shuffle indices using Fisher-Yates algorithm
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Create randomized options array
    const randomisedOptions = indices.map(i => options[i]);
    
    // Find the index of the correct answer in the randomized array
    const correctAnswerIndex = randomisedOptions.findIndex(option => option === correctAnswer);
    
    return {
      randomisedOptions,
      correctAnswerIndex
    };
  };

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/learning/assessments/${assessmentId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        // Randomize answers for each question
        const questionsWithRandomizedAnswers = data.questions.map((question: Question) => {
          if (question.question_type === 'multiple_choice' && question.options.length > 1) {
            const { randomisedOptions, correctAnswerIndex } = randomizeAnswers(
              question.options, 
              question.correct_answer
            );
            return {
              ...question,
              randomised_options: randomisedOptions,
              correct_answer_index: correctAnswerIndex
            };
          }
          return question;
        });
        
        setAssessment({
          ...data,
          questions: questionsWithRandomizedAnswers
        });
        setTimeRemaining(data.time_limit_minutes * 60);
      } else {
        setError('Failed to load assessment');
      }
    } catch (err) {
      setError('Error loading assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    try {
      const response = await fetch(`${api.baseUrl}/api/learning/assessments/${assessmentId}/attempt`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            question_id: parseInt(questionId),
            answer: answer
          }))
        })
      });

      if (response.ok) {
        const attemptData = await response.json();
        setAttempt(attemptData);
        setIsSubmitted(true);
        if (onComplete) {
          onComplete(attemptData);
        }
      } else {
        setError('Failed to submit assessment');
      }
    } catch (err) {
      setError('Error submitting assessment');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    const question = assessment?.questions[index];
    if (!question) return 'unanswered';
    
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === '') return 'unanswered';
    return 'answered';
  };

  const renderQuestion = () => {
    if (!assessment) return null;

    const question = assessment.questions[currentQuestionIndex];
    const answer = answers[question.id];

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {assessment.total_questions}
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
          <div className="text-sm text-gray-600">
            {question.points} point{question.points !== 1 ? 's' : ''}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium">
            {question.question_text}
          </div>

          {question.question_type === 'multiple_choice' && (
            <RadioGroup
              value={answer}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {(question.randomised_options || question.options).map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} className="h-4 w-4 sm:h-5 sm:w-5" />
                  <label htmlFor={`${question.id}-${index}`} className="text-sm sm:text-base cursor-pointer flex-1 leading-relaxed">
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.question_type === 'true_false' && (
            <RadioGroup
              value={answer}
              onValueChange={(value) => handleAnswerChange(question.id, value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id={`${question.id}-true`} />
                <label htmlFor={`${question.id}-true`} className="text-sm">True</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id={`${question.id}-false`} />
                <label htmlFor={`${question.id}-false`} className="text-sm">False</label>
              </div>
            </RadioGroup>
          )}

          {question.question_type === 'fill_blank' && (
            <Input
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer here..."
              className="max-w-md"
            />
          )}

          <div className="flex flex-col sm:flex-row justify-between pt-4 space-y-2 sm:space-y-0">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="w-full sm:w-auto touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto touch-manipulation"
              >
                <Award className="h-4 w-4 mr-2" />
                Submit Assessment
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full sm:w-auto touch-manipulation">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    if (!attempt) return null;

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            Assessment Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
              {attempt.percentage}%
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {attempt.passed ? 'Congratulations! You have successfully passed this assessment!' : 'Unfortunately, you did not achieve the required passing score. Please review the material and retake the assessment.'}
            </div>
            <Badge className={attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {attempt.passed ? 'PASSED' : 'FAILED'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{attempt.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{attempt.time_taken_minutes}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Passing Score:</span>
              <span>{assessment?.passing_score}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Your Score:</span>
              <span>{attempt.percentage}%</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Assessment
            </Button>
            <Button
              onClick={onExit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onExit}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (isSubmitted && attempt) {
    return renderResults();
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600">Assessment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6"
      onTouchStart={swipeGestures.onTouchStart as any}
      onTouchMove={swipeGestures.onTouchMove as any}
      onTouchEnd={swipeGestures.onTouchEnd}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{assessment.title}</h1>
          <p className="text-sm sm:text-base text-gray-600 line-clamp-2 sm:line-clamp-1">{assessment.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              🇬🇧 UK English
            </Badge>
            <Badge variant="outline" className="text-xs">
              🎲 Randomised Answers
            </Badge>
          </div>
        </div>
        <Button onClick={onExit} variant="outline" className="w-full sm:w-auto touch-manipulation">
          Exit Assessment
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{currentQuestionIndex + 1} of {assessment.total_questions}</span>
        </div>
        <Progress value={((currentQuestionIndex + 1) / assessment.total_questions) * 100} className="h-2" />
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
        {assessment.questions.map((_, index) => (
          <Button
            key={index}
            variant={currentQuestionIndex === index ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm touch-manipulation ${
              getQuestionStatus(index) === 'answered' 
                ? 'bg-green-100 text-green-800 border-green-300' 
                : ''
            }`}
          >
            {index + 1}
          </Button>
        ))}
      </div>

      {/* Question */}
      {renderQuestion()}
    </div>
  );
}
