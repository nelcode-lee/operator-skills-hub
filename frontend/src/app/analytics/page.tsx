"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Award,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalCourses: number;
    totalHours: number;
    completionRate: number;
    averageRating: number;
    activeEnrollments: number;
  };
  coursePerformance: Array<{
    id: number;
    title: string;
    enrollments: number;
    completions: number;
    averageScore: number;
    rating: number;
    revenue: number;
  }>;
  studentEngagement: Array<{
    month: string;
    activeStudents: number;
    newEnrollments: number;
    completions: number;
  }>;
  recentActivity: Array<{
    id: number;
    type: 'enrollment' | 'completion' | 'test' | 'feedback';
    student: string;
    course: string;
    timestamp: string;
    score?: number;
  }>;
  topPerformers: Array<{
    id: number;
    name: string;
    coursesCompleted: number;
    averageScore: number;
    lastActivity: string;
  }>;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCourse, setSelectedCourse] = useState('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedCourse]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockData: AnalyticsData = {
        overview: {
          totalStudents: 156,
          totalCourses: 8,
          totalHours: 1240,
          completionRate: 87.5,
          averageRating: 4.6,
          activeEnrollments: 89
        },
        coursePerformance: [
          {
            id: 1,
            title: "Excavator Safety Training",
            enrollments: 45,
            completions: 42,
            averageScore: 88.5,
            rating: 4.7,
            revenue: 12600
          },
          {
            id: 2,
            title: "GPS Machine Control",
            enrollments: 38,
            completions: 35,
            averageScore: 92.1,
            rating: 4.8,
            revenue: 10500
          },
          {
            id: 3,
            title: "Load Chart Interpretation",
            enrollments: 32,
            completions: 28,
            averageScore: 85.2,
            rating: 4.5,
            revenue: 8400
          },
          {
            id: 4,
            title: "Site Safety Plus",
            enrollments: 28,
            completions: 26,
            averageScore: 90.3,
            rating: 4.6,
            revenue: 7800
          }
        ],
        studentEngagement: [
          { month: 'Jan', activeStudents: 45, newEnrollments: 12, completions: 8 },
          { month: 'Feb', activeStudents: 52, newEnrollments: 15, completions: 11 },
          { month: 'Mar', activeStudents: 48, newEnrollments: 10, completions: 14 },
          { month: 'Apr', activeStudents: 61, newEnrollments: 18, completions: 9 },
          { month: 'May', activeStudents: 58, newEnrollments: 14, completions: 16 },
          { month: 'Jun', activeStudents: 67, newEnrollments: 22, completions: 12 }
        ],
        recentActivity: [
          {
            id: 1,
            type: 'completion',
            student: 'John Smith',
            course: 'Excavator Safety Training',
            timestamp: '2 hours ago',
            score: 92
          },
          {
            id: 2,
            type: 'enrollment',
            student: 'Sarah Johnson',
            course: 'GPS Machine Control',
            timestamp: '4 hours ago'
          },
          {
            id: 3,
            type: 'test',
            student: 'Mike Wilson',
            course: 'Load Chart Interpretation',
            timestamp: '6 hours ago',
            score: 88
          },
          {
            id: 4,
            type: 'feedback',
            student: 'Emma Davis',
            course: 'Site Safety Plus',
            timestamp: '1 day ago'
          }
        ],
        topPerformers: [
          {
            id: 1,
            name: 'John Smith',
            coursesCompleted: 4,
            averageScore: 94.2,
            lastActivity: '2 hours ago'
          },
          {
            id: 2,
            name: 'Sarah Johnson',
            coursesCompleted: 3,
            averageScore: 91.8,
            lastActivity: '1 day ago'
          },
          {
            id: 3,
            name: 'Mike Wilson',
            coursesCompleted: 3,
            averageScore: 89.5,
            lastActivity: '2 days ago'
          }
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return <Users className="h-4 w-4 text-blue-500" />;
      case 'completion': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'test': return <Award className="h-4 w-4 text-purple-500" />;
      case 'feedback': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'enrollment': return 'bg-blue-100 text-blue-800';
      case 'completion': return 'bg-green-100 text-green-800';
      case 'test': return 'bg-purple-100 text-purple-800';
      case 'feedback': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPath="/analytics" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPath="/analytics" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">Unable to load analytics data. Please try again.</p>
            <Button onClick={loadAnalyticsData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPath="/analytics" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Track your teaching performance and student progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => console.log('Export analytics')} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalHours.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.averageRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.activeEnrollments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Course Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Course Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.coursePerformance.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <Badge variant="outline">{course.rating} ⭐</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Enrollments</p>
                        <p className="font-semibold">{course.enrollments}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completions</p>
                        <p className="font-semibold">{course.completions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Score</p>
                        <p className="font-semibold">{course.averageScore}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-semibold">£{course.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Completion Rate</span>
                        <span>{Math.round((course.completions / course.enrollments) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(course.completions / course.enrollments) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Student Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Student Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.studentEngagement.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                      <div className="flex space-x-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Active: {month.activeStudents}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">New: {month.newEnrollments}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                          <span className="text-gray-600">Completed: {month.completions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.student}
                        </p>
                        <Badge className={getActivityColor(activity.type)}>
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{activity.course}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        {activity.score && (
                          <span className="text-xs font-medium text-gray-900">
                            Score: {activity.score}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPerformers.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.coursesCompleted} courses completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{student.averageScore}%</p>
                      <p className="text-xs text-gray-500">{student.lastActivity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
