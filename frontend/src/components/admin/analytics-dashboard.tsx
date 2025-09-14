"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Download, 
  Calendar,
  Clock,
  Award,
  MessageSquare,
  Target,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface OverviewMetrics {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  users: {
    total: number;
    active: number;
    new_registrations: number;
    retention_rate: number;
  };
  courses: {
    total: number;
    active: number;
    enrollments: number;
    completions: number;
  };
  learning: {
    total_hours: number;
    assessments_attempted: number;
    assessments_passed: number;
    pass_rate: number;
  };
  engagement: {
    messages_sent: number;
    qa_posts_created: number;
  };
}

interface TimeSeriesData {
  metric: string;
  granularity: string;
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  data: Array<{
    date: string;
    value: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [overviewData, setOverviewData] = useState<OverviewMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("users");
  const [selectedGranularity, setSelectedGranularity] = useState("daily");

  useEffect(() => {
    loadOverviewData();
    loadTimeSeriesData();
  }, [selectedPeriod]);

  useEffect(() => {
    loadTimeSeriesData();
  }, [selectedMetric, selectedGranularity]);

  const loadOverviewData = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/analytics/overview?days=${selectedPeriod}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSeriesData = async () => {
    try {
      const response = await fetch(
        `${api.baseUrl}/api/analytics/timeseries?metric=${selectedMetric}&days=${selectedPeriod}&granularity=${selectedGranularity}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data);
      }
    } catch (error) {
      console.error('Error loading time series data:', error);
    }
  };

  const exportData = async (format: string) => {
    try {
      const response = await fetch(
        `${api.baseUrl}/api/analytics/export?format=${format}&metric=overview&days=${selectedPeriod}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Create download link
        const blob = new Blob([data.content], { type: data.content_type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform insights and reporting</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportData('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => exportData('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="text-sm text-gray-600">
          {overviewData && (
            <span>
              {new Date(overviewData.period.start_date).toLocaleDateString()} - {new Date(overviewData.period.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Overview Metrics */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.users.total.toLocaleString()}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Active: {overviewData.users.active.toLocaleString()}</span>
                <Badge variant="secondary">{overviewData.users.retention_rate.toFixed(1)}% retention</Badge>
              </div>
              <div className="text-xs text-green-600 mt-1">
                +{overviewData.users.new_registrations} new this period
              </div>
            </CardContent>
          </Card>

          {/* Courses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.courses.total}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Active: {overviewData.courses.active}</span>
                <Badge variant="secondary">{overviewData.courses.enrollments} enrollments</Badge>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {overviewData.courses.completions} completions
              </div>
            </CardContent>
          </Card>

          {/* Learning Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.learning.total_hours.toFixed(1)}h</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{overviewData.learning.assessments_attempted} attempts</span>
                <Badge variant="secondary">{overviewData.learning.pass_rate.toFixed(1)}% pass rate</Badge>
              </div>
              <div className="text-xs text-green-600 mt-1">
                {overviewData.learning.assessments_passed} passed
              </div>
            </CardContent>
          </Card>

          {/* Engagement Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewData.engagement.messages_sent}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>Messages sent</span>
                <Badge variant="secondary">{overviewData.engagement.qa_posts_created} Q&A posts</Badge>
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Active community participation
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="courses">Course Analytics</TabsTrigger>
          <TabsTrigger value="users">User Engagement</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trend Analysis</CardTitle>
                <div className="flex space-x-2">
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">New Users</SelectItem>
                      <SelectItem value="enrollments">Enrollments</SelectItem>
                      <SelectItem value="completions">Completions</SelectItem>
                      <SelectItem value="learning_hours">Learning Hours</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedGranularity} onValueChange={setSelectedGranularity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timeSeriesData && timeSeriesData.data.length > 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Chart visualization would go here</p>
                    <p className="text-sm text-gray-500">
                      {timeSeriesData.data.length} data points for {selectedMetric}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>Detailed course analytics would be displayed here</p>
                <p className="text-sm">Including completion rates, user feedback, and engagement metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>User engagement analytics would be displayed here</p>
                <p className="text-sm">Including activity patterns, learning progress, and participation metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>Custom report builder would be available here</p>
                <p className="text-sm">Create, schedule, and export custom analytics reports</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}







