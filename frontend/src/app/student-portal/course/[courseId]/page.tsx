"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  FileText, 
  Image, 
  Video,
  Award,
  ArrowLeft,
  Download,
  ExternalLink,
  User,
  Calendar
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string | null;
  duration_hours: number | null;
  difficulty_level: string | null;
  progress_percentage: number;
  enrolled_at: string;
  last_accessed: string;
  status: 'active' | 'completed' | 'paused';
}

interface Content {
  id: number;
  title: string;
  content_type: 'pdf' | 'video' | 'image' | 'interactive' | 'test';
  description: string;
  file_path?: string;
  duration_minutes?: number;
  is_completed: boolean;
  completion_percentage: number;
  last_accessed?: string;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      
      // Load course details and content
      const [courseRes, contentRes] = await Promise.all([
        fetch(`${api.baseUrl}/api/learning/my-courses`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/learning/courses/${courseId}/content`, {
          headers: getAuthHeaders()
        })
      ]);

      if (courseRes.ok) {
        const coursesData = await courseRes.json();
        const currentCourse = coursesData.find((c: Course) => c.id === parseInt(courseId));
        setCourse(currentCourse || null);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setCourseContent(contentData);
      }
    } catch (err) {
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const startLearningSession = async (contentId: number) => {
    try {
      const response = await fetch(`${api.baseUrl}/api/learning/sessions/start`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: contentId,
          course_id: parseInt(courseId)
        })
      });

      if (response.ok) {
        // Navigate to content viewer
        window.open(`/student-portal/content/${contentId}`, '_blank');
      }
    } catch (err) {
      setError('Failed to start learning session');
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'test': return <Award className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (level: string | null) => {
    if (!level) return 'bg-gray-100 text-gray-800';
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This course could not be loaded.'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Learning Portal
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 text-lg mb-4">{course.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level || 'Unknown'}
                </Badge>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{course.duration_hours || 0} hours</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="lg:ml-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Course Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span className="font-medium">{course.progress_percentage}%</span>
                    </div>
                    <Progress value={course.progress_percentage} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {courseContent.filter(c => c.is_completed).length}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {courseContent.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Lessons</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Content
            </CardTitle>
            <CardDescription>
              Click on any lesson to start learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseContent.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
                <p className="text-gray-600">
                  Course content is being prepared. Please check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {courseContent.map((content, index) => (
                  <div 
                    key={content.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => startLearningSession(content.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getContentIcon(content.content_type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            Lesson {index + 1}
                          </span>
                          {content.is_completed && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{content.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          {content.duration_minutes && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{content.duration_minutes} min</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="capitalize">{content.content_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {content.completion_percentage}%
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${content.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <Play className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Resources */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5" />
                Course Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Course Handbook</div>
                    <div className="text-xs text-gray-500">PDF • 2.8MB</div>
                  </div>
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Safety Guidelines</div>
                    <div className="text-xs text-gray-500">PDF • 1.5MB</div>
                  </div>
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Equipment Manual</div>
                    <div className="text-xs text-gray-500">PDF • 4.2MB</div>
                  </div>
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Practice Test</div>
                    <div className="text-xs text-gray-500">25 questions • 30 min</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Final Assessment</div>
                    <div className="text-xs text-gray-500">50 questions • 60 min</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Ask Instructor</div>
                    <div className="text-xs text-gray-500">Get help with course content</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Course Forum</div>
                    <div className="text-xs text-gray-500">Discuss with other students</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
