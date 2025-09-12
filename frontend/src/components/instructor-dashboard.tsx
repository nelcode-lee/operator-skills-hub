"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { api } from '@/lib/api';
import { 
  Upload, 
  Users, 
  BookOpen, 
  Clock, 
  BarChart3, 
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  TestTube
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  student_count: number;
  content_count: number;
  created_at: string;
}

interface Student {
  student_id: number;
  enrolled_at: string;
  last_accessed: string;
}

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null as File | null
  });
  const [accessData, setAccessData] = useState({
    student_id: '',
    action: 'grant' // 'grant' or 'revoke'
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadCourseStudents = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStudents(data.students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !selectedCourse) return;

    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('course_id', selectedCourse.id.toString());
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);

    try {
      const response = await fetch(`${api.baseUrl}/api/instructor-ai/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadData({ title: '', description: '', file: null });
        loadCourses();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleAccessControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const endpoint = accessData.action === 'grant' 
      ? `/api/courses/${selectedCourse.id}/grant-access`
      : `/api/courses/${selectedCourse.id}/revoke-access`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          student_id: parseInt(accessData.student_id)
        })
      });

      if (response.ok) {
        setShowAccessModal(false);
        setAccessData({ student_id: '', action: 'grant' });
        loadCourseStudents(selectedCourse.id);
      }
    } catch (error) {
      console.error('Error managing access:', error);
    }
  };

  const createKnowledgeTest = async (contentId: number) => {
    try {
      const response = await fetch(`/api/courses/${selectedCourse?.id}/content/${contentId}/create-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          test_type: 'multiple_choice',
          question_count: 10
        })
      });

      if (response.ok) {
        alert('Knowledge test created successfully!');
      }
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your courses and student access</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.student_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Upload className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Content Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.content_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{course.title}</span>
                  <Button
                    onClick={() => setSelectedCourse(course)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{course.student_count} students</span>
                  <span>{course.content_count} items</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={() => {
                      setSelectedCourse(course);
                      loadCourseStudents(course.id);
                    }}
                    size="sm"
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Course Details */}
        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCourse.title} - Student Management</span>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                  <Button
                    onClick={() => setShowAccessModal(true)}
                    size="sm"
                    variant="outline"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Access
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.student_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Student #{student.student_id}</p>
                      <p className="text-sm text-gray-500">
                        Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Last accessed: {new Date(student.last_accessed).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <TestTube className="h-4 w-4 mr-2" />
                        Create Test
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Upload PDF Course Material</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadData.description}
                      onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">PDF File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" className="flex-1">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUploadModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Access Control Modal */}
        {showAccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Manage Student Access</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccessControl} className="space-y-4">
                  <div>
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      type="number"
                      value={accessData.student_id}
                      onChange={(e) => setAccessData({...accessData, student_id: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="action">Action</Label>
                    <select
                      id="action"
                      value={accessData.action}
                      onChange={(e) => setAccessData({...accessData, action: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="grant">Grant Access</option>
                      <option value="revoke">Revoke Access</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" className="flex-1">
                      {accessData.action === 'grant' ? (
                        <UserPlus className="h-4 w-4 mr-2" />
                      ) : (
                        <UserMinus className="h-4 w-4 mr-2" />
                      )}
                      {accessData.action === 'grant' ? 'Grant' : 'Revoke'} Access
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAccessModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

