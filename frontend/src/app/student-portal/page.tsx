"use client";

import React, { useState, useEffect } from 'react';
import { useContentCache } from '@/hooks/useContentCache';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  FileText, 
  Image, 
  Video,
  Award,
  TrendingUp,
  Calendar,
  Target,
  Download,
  ExternalLink,
  Search,
  Filter,
  Plus,
  BookMarked,
  HelpCircle,
  Lightbulb,
  LogOut,
  UserPlus,
  Send,
  MessageSquare
} from 'lucide-react';
import NextImage from 'next/image';
import { api, getAuthHeaders, logout } from '@/lib/api';
import CourseRequestForm from '@/components/CourseRequestForm';
import MessagingInterface from '@/components/messaging-interface';
import NotificationBell from '@/components/notification-bell';

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

interface LearningSession {
  id: number;
  course_id: number;
  content_id: number;
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  progress_percentage: number;
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

export default function StudentPortal() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<Content[]>([]);
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestingCourse, setRequestingCourse] = useState<Course | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Content caching for better performance
  const coursesCache = useContentCache<Course[]>({ ttl: 2 * 60 * 1000 }); // 2 minutes
  const sessionsCache = useContentCache<LearningSession[]>({ ttl: 1 * 60 * 1000 }); // 1 minute

  useEffect(() => {
    loadStudentData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(api.auth.me, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cachedCourses = coursesCache.get('my-courses');
      const cachedSessions = sessionsCache.get('my-sessions');
      
      if (cachedCourses) {
        setCourses(cachedCourses);
      }
      
      if (cachedSessions) {
        setLearningSessions(cachedSessions);
      }

      // Fetch fresh data
      const [coursesRes, sessionsRes, availableCoursesRes] = await Promise.all([
        fetch(api.learning.myCourses, {
          headers: getAuthHeaders()
        }),
        fetch(api.learning.mySessions, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/courses/`, {
          headers: getAuthHeaders()
        })
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
        coursesCache.set('my-courses', coursesData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setLearningSessions(sessionsData);
        sessionsCache.set('my-sessions', sessionsData);
      }

      if (availableCoursesRes.ok) {
        const availableCoursesData = await availableCoursesRes.json();
        // Filter out courses the student is already enrolled in
        const enrolledCourseIds = courses.map(c => c.id);
        const filteredAvailable = availableCoursesData.filter((course: Course) => 
          !enrolledCourseIds.includes(course.id)
        );
        setAvailableCourses(filteredAvailable);
      }
    } catch (err) {
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseContent = async (courseId: number) => {
    try {
      const response = await fetch(api.learning.getContent(courseId), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setCourseContent(data);
      }
    } catch (err) {
      setError('Failed to load course content');
    }
  };

  const handleRequestCourse = (course: Course) => {
    setRequestingCourse(course);
    setShowRequestForm(true);
  };

  const handleRequestSubmitted = () => {
    setShowRequestForm(false);
    setRequestingCourse(null);
    // Reload data to update available courses
    loadStudentData();
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
          course_id: selectedCourse?.id
        })
      });

      if (response.ok) {
        const session = await response.json();
        setLearningSessions(prev => [...prev, session]);
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

  const getCourseThumbnail = (course: Course) => {
    // Return relevant thumbnail based on course title/category
    const title = course.title.toLowerCase();
    const category = course.category?.toLowerCase() || '';
    
    // Plant Training & Equipment courses
    if (title.includes('plant') || title.includes('excavator') || title.includes('dumper') || 
        title.includes('crane') || title.includes('loader') || title.includes('bulldozer')) {
      return '/images/equipment/forward-tipping-dumper.png';
    }
    
    // Health & Safety courses
    if (title.includes('health') || title.includes('safety') || title.includes('h&s') || 
        category.includes('health') || category.includes('safety')) {
      return '/images/courses/H&S.jpg';
    }
    
    // GPS Training courses
    if (title.includes('gps') || title.includes('machine control') || 
        category.includes('gps')) {
      return '/images/courses/gps training.jpeg';
    }
    
    // Utility Detection courses
    if (title.includes('utility') || title.includes('detection') || 
        category.includes('utility')) {
      return '/images/equipment/utility-detection.jpg';
    }
    
    // Streetworks courses
    if (title.includes('streetworks') || title.includes('nrswa') || 
        category.includes('streetworks')) {
      return '/images/courses/streetworks.jpg';
    }
    
    // Site Safety courses
    if (title.includes('site safety') || title.includes('safety plus') || 
        category.includes('site safety')) {
      return '/images/courses/site safety.jpeg';
    }
    
    // NOCN courses
    if (title.includes('nocn') || category.includes('nocn')) {
      return '/images/courses/nocn.jpeg';
    }
    
    // Accreditation courses
    if (title.includes('accreditation') || title.includes('compliance') || 
        category.includes('accreditation')) {
      return '/images/courses/accreditations.png';
    }
    
    // Default fallback
    return '/images/equipment/forward-tipping-dumper.png';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Learning Portal</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Continue your construction training journey at your own pace
          </p>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{courses.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Enrolled</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {courses.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Completed</div>
          </div>
          {currentUser && (
            <NotificationBell currentUserId={currentUser.id} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Tabs defaultValue="learning" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="learning" className="text-xs sm:text-sm px-2 py-2">Learning</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs sm:text-sm px-2 py-2">Courses</TabsTrigger>
          <TabsTrigger value="resources" className="text-xs sm:text-sm px-2 py-2">Resources</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs sm:text-sm px-2 py-2">Progress</TabsTrigger>
          <TabsTrigger value="messaging" className="text-xs sm:text-sm px-2 py-2 flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>Messages</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs sm:text-sm px-2 py-2">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="learning" className="space-y-4 sm:space-y-6">
          {/* Quick Actions */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation" onClick={() => window.location.href = '/student-catalog'}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">Browse New Courses</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Discover new training opportunities</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation" onClick={() => window.location.href = '/student-portal#resources'}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <BookMarked className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">Learning Resources</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Access study materials and guides</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation sm:col-span-2 lg:col-span-1" onClick={() => window.location.href = '/student-portal#progress'}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">View Progress</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Track your learning journey</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Continue Learning
              </CardTitle>
              <CardDescription>
                Pick up where you left off in your enrolled courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.filter(c => c.status === 'active').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No active courses</p>
                  <p className="mb-4">Start your learning journey by enrolling in a course!</p>
                  <Button onClick={() => window.location.href = '/student-catalog'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                  {courses.filter(c => c.status === 'active').map((course) => (
                    <div key={course.id} 
                         className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer touch-manipulation"
                         onClick={() => {
                           setSelectedCourse(course);
                           loadCourseContent(course.id);
                         }}>
                      <div className="flex items-start sm:items-center space-x-3 mb-3 sm:mb-0">
                        <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base truncate">{course.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-1">{course.description}</p>
                          <div className="flex items-center space-x-2 mt-1 flex-wrap">
                            <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500">{course.duration_hours || 0}h</span>
                            <Badge className={`${getDifficultyColor(course.difficulty_level)} text-xs`}>
                              {course.difficulty_level || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                        <div className="flex items-center space-x-2 flex-1 sm:flex-none">
                          <Progress value={course.progress_percentage} className="w-12 sm:w-16 h-2 flex-1 sm:flex-none" />
                          <span className="text-xs sm:text-sm text-gray-600 min-w-[2.5rem]">{course.progress_percentage}%</span>
                        </div>
                        <Play className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest learning sessions and progress updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learningSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity. Start learning to see your progress here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {learningSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Learning Session</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.started_at).toLocaleDateString()} at {new Date(session.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{session.duration_minutes} min</div>
                        <div className="text-sm text-gray-600">{session.progress_percentage}% complete</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          {/* Enrolled Courses */}
          {courses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                My Enrolled Courses ({courses.length})
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedCourse(course);
                          loadCourseContent(course.id);
                        }}>
                    <CardHeader>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <NextImage
                            src={getCourseThumbnail(course)}
                            alt={course.title}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg truncate">{course.title}</CardTitle>
                            <Badge className={getStatusColor(course.status)}>
                              {course.status}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">{course.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{course.progress_percentage}%</span>
                        </div>
                        <Progress value={course.progress_percentage} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration_hours || 0}h</span>
                          </div>
                          <Badge className={getDifficultyColor(course.difficulty_level)}>
                            {course.difficulty_level || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Last accessed: {new Date(course.last_accessed).toLocaleDateString()}
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            className="w-full" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/learning/${course.id}`;
                            }}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Start Learning
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Courses */}
          {availableCourses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Available Courses ({availableCourses.length})
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Request access to these courses. An instructor or admin will review your request.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <NextImage
                            src={getCourseThumbnail(course)}
                            alt={course.title}
                            width={60}
                            height={60}
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg truncate">{course.title}</CardTitle>
                            <Badge variant="outline">
                              Available
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">{course.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration_hours || 0}h</span>
                          </div>
                          <Badge className={getDifficultyColor(course.difficulty_level)}>
                            {course.difficulty_level || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Category: {course.category || 'General'}
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => handleRequestCourse(course)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Request Access
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No courses message */}
          {courses.length === 0 && availableCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Available</h3>
              <p className="text-gray-600">
                There are currently no courses available. Please contact your instructor or admin.
              </p>
            </div>
          )}

          {selectedCourse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedCourse.title} - Learning Content
                </CardTitle>
                <CardDescription>
                  Click on any content to start learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {courseContent.map((content) => (
                    <div key={content.id} 
                         className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => startLearningSession(content.id)}>
                      <div className="flex items-center space-x-3">
                        {getContentIcon(content.content_type)}
                        <div>
                          <h4 className="font-medium">{content.title}</h4>
                          <p className="text-sm text-gray-600">{content.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {content.duration_minutes && (
                              <span className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {content.duration_minutes}min
                              </span>
                            )}
                            {content.is_completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={content.completion_percentage} className="w-16 h-2" />
                        <span className="text-sm text-gray-600">{content.completion_percentage}%</span>
                        <Play className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 sm:space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search resources..."
                      className="pl-10 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="study-guides">Study Guides</SelectItem>
                    <SelectItem value="videos">Video Tutorials</SelectItem>
                    <SelectItem value="tests">Practice Tests</SelectItem>
                    <SelectItem value="support">Help & Support</SelectItem>
                    <SelectItem value="tips">Learning Tips</SelectItem>
                    <SelectItem value="materials">Course Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Study Guides */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Study Guides
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Comprehensive guides for construction training
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg border cursor-pointer touch-manipulation">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">Health & Safety Guidelines 2024</div>
                      <div className="text-xs text-gray-500 truncate">Updated: 15 Jan 2024 • PDF • 2.3MB</div>
                    </div>
                    <Download className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg border cursor-pointer touch-manipulation">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">Excavator Operation Manual</div>
                      <div className="text-xs text-gray-500 truncate">Updated: 10 Jan 2024 • PDF • 4.1MB</div>
                    </div>
                    <Download className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg border cursor-pointer touch-manipulation">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">Site Safety Checklist</div>
                      <div className="text-xs text-gray-500 truncate">Updated: 8 Jan 2024 • PDF • 1.2MB</div>
                    </div>
                    <Download className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg border cursor-pointer touch-manipulation">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">CPCS Theory Test Guide</div>
                      <div className="text-xs text-gray-500 truncate">Updated: 5 Jan 2024 • PDF • 3.7MB</div>
                    </div>
                    <Download className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Tutorials */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-600" />
                  Video Tutorials
                </CardTitle>
                <CardDescription>
                  Step-by-step video demonstrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Excavator Pre-Use Inspection</div>
                      <div className="text-xs text-gray-500">Duration: 12:34 • HD • 45 views</div>
                    </div>
                    <Play className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Safe Digging Procedures</div>
                      <div className="text-xs text-gray-500">Duration: 18:22 • HD • 32 views</div>
                    </div>
                    <Play className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">GPS Machine Control Setup</div>
                      <div className="text-xs text-gray-500">Duration: 25:15 • HD • 28 views</div>
                    </div>
                    <Play className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Utility Detection Techniques</div>
                      <div className="text-xs text-gray-500">Duration: 15:08 • HD • 19 views</div>
                    </div>
                    <Play className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Practice Tests */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Practice Tests
                </CardTitle>
                <CardDescription>
                  Test your knowledge with practice assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Health & Safety Quiz</div>
                      <div className="text-xs text-gray-500">25 questions • 30 min • 85% pass rate</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Plant Operation Test</div>
                      <div className="text-xs text-gray-500">40 questions • 45 min • 78% pass rate</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">CPCS Theory Practice</div>
                      <div className="text-xs text-gray-500">50 questions • 60 min • 82% pass rate</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Site Safety Assessment</div>
                      <div className="text-xs text-gray-500">30 questions • 35 min • 88% pass rate</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  Help & Support
                </CardTitle>
                <CardDescription>
                  Get help when you need it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Student FAQ</div>
                      <div className="text-xs text-gray-500">Common questions and answers</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Contact Support</div>
                      <div className="text-xs text-gray-500">Email: support@operatorskills.co.uk</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">User Guide</div>
                      <div className="text-xs text-gray-500">Complete platform guide</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Technical Support</div>
                      <div className="text-xs text-gray-500">Phone: 0121 123 4567</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Tips */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Learning Tips
                </CardTitle>
                <CardDescription>
                  Maximize your learning potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Effective Study Techniques</div>
                      <div className="text-xs text-gray-500">Proven methods for construction training</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Time Management Guide</div>
                      <div className="text-xs text-gray-500">Balance work and learning</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Exam Preparation Tips</div>
                      <div className="text-xs text-gray-500">Ace your CPCS and NPORS tests</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Memory Techniques</div>
                      <div className="text-xs text-gray-500">Remember safety procedures</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Materials */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Course Materials
                </CardTitle>
                <CardDescription>
                  Additional materials for your enrolled courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Excavator Course Handouts</div>
                      <div className="text-xs text-gray-500">PDF • 2.8MB • Updated today</div>
                    </div>
                    <Download className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Safety Reference Cards</div>
                      <div className="text-xs text-gray-500">PDF • 1.5MB • Updated 2 days ago</div>
                    </div>
                    <Download className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Supplementary Reading</div>
                      <div className="text-xs text-gray-500">PDF • 5.2MB • Updated 1 week ago</div>
                    </div>
                    <Download className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border cursor-pointer">
                    <div className="flex-1">
                      <div className="font-medium text-sm">Equipment Specifications</div>
                      <div className="text-xs text-gray-500">PDF • 3.1MB • Updated 3 days ago</div>
                    </div>
                    <Download className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recently Added Resources
              </CardTitle>
              <CardDescription>
                Latest materials added by your instructors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Updated Health & Safety Guidelines</div>
                      <div className="text-sm text-gray-600">Added by John Smith • 2 hours ago</div>
                    </div>
                  </div>
                  <Badge variant="outline">New</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Video className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">GPS Machine Control Tutorial</div>
                      <div className="text-sm text-gray-600">Added by Sarah Johnson • 1 day ago</div>
                    </div>
                  </div>
                  <Badge variant="outline">New</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">CPCS Practice Test v2.1</div>
                      <div className="text-sm text-gray-600">Added by Mike Wilson • 3 days ago</div>
                    </div>
                  </div>
                  <Badge variant="outline">Updated</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{course.title}</span>
                        <span className="text-sm text-gray-600">{course.progress_percentage}%</span>
                      </div>
                      <Progress value={course.progress_percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(courses.reduce((acc, course) => acc + course.progress_percentage, 0) / courses.length)}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Progress</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-green-600">
                        {courses.filter(c => c.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">
                        {courses.filter(c => c.status === 'active').length}
                      </div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Learning Sessions
              </CardTitle>
              <CardDescription>
                Track your learning activity and time spent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learningSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No learning sessions yet. Start learning to see your activity here!
                </div>
              ) : (
                <div className="space-y-4">
                  {learningSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Learning Session</h4>
                          <p className="text-sm text-gray-600">
                            Started: {new Date(session.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{session.duration_minutes} minutes</div>
                        <div className="text-sm text-gray-600">{session.progress_percentage}% complete</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging" className="space-y-6">
          {currentUser && (
            <MessagingInterface 
              userRole="student" 
              currentUserId={currentUser.id} 
            />
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements & Certificates
              </CardTitle>
              <CardDescription>
                Your learning milestones and accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Complete courses to earn achievements and certificates!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course Request Form Modal */}
      {showRequestForm && requestingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CourseRequestForm
              courseId={requestingCourse.id}
              courseTitle={requestingCourse.title}
              onRequestSubmitted={handleRequestSubmitted}
              onClose={() => {
                setShowRequestForm(false);
                setRequestingCourse(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
