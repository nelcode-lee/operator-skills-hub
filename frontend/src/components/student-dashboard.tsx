"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Award,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Trophy,
  Zap
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface LearningStats {
  total_courses: number;
  completed_courses: number;
  overall_progress: number;
  total_learning_time_minutes: number;
  current_streak_days: number;
  achievements_earned: number;
}

interface RecentActivity {
  id: number;
  type: 'course_completed' | 'session_started' | 'assessment_passed' | 'achievement_earned';
  title: string;
  description: string;
  timestamp: string;
  course_title?: string;
}

interface CourseProgress {
  id: number;
  title: string;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused';
  last_accessed: string;
  estimated_completion: string;
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, coursesRes] = await Promise.all([
        fetch(`${api.baseUrl}/api/learning/progress`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/learning/recent-activity`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/learning/my-courses`, {
          headers: getAuthHeaders()
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourseProgress(coursesData);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'session_started': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'assessment_passed': return <Award className="h-4 w-4 text-yellow-600" />;
      case 'achievement_earned': return <Trophy className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
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

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
            <p className="text-blue-100">
              Continue your construction training journey. You're making great progress!
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats?.overall_progress || 0}%</div>
            <div className="text-blue-100">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Courses Enrolled</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.total_courses || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats?.completed_courses || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Learning Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatTime(stats?.total_learning_time_minutes || 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.current_streak_days || 0} days</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Course Progress
            </CardTitle>
            <CardDescription>
              Track your progress across all enrolled courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseProgress.slice(0, 5).map((course) => (
                <div key={course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{course.title}</h4>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{course.progress_percentage}%</span>
                    </div>
                    <Progress value={course.progress_percentage} className="h-2" />
                  </div>
                  <div className="text-xs text-gray-500">
                    Last accessed: {formatDate(course.last_accessed)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest learning activities and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start learning to see your activity here!</p>
                </div>
              ) : (
                recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      {activity.course_title && (
                        <p className="text-xs text-blue-600">
                          {activity.course_title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Continue your learning journey with these quick actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              variant="outline"
              onClick={() => window.location.href = '/student-portal'}
            >
              <BookOpen className="h-6 w-6" />
              <span>Continue Learning</span>
            </Button>
            
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              variant="outline"
              onClick={() => window.location.href = '/student-portal?tab=progress'}
            >
              <BarChart3 className="h-6 w-6" />
              <span>View Progress</span>
            </Button>
            
            <Button 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              variant="outline"
              onClick={() => window.location.href = '/student-portal?tab=achievements'}
            >
              <Trophy className="h-6 w-6" />
              <span>Achievements</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









