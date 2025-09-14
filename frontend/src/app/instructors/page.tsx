"use client";

import React, { useState, useEffect } from 'react';
import { api, logout } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  TestTube,
  Settings,
  LogOut,
  MessageSquare
} from 'lucide-react';
import Navigation from '@/components/navigation';
import Breadcrumb from '@/components/breadcrumb';
import CourseContentBuilder from '@/components/course-content-builder';
import CourseCreationForm from '@/components/course-creation-form';
import CourseRequestManagement from '@/components/CourseRequestManagement';
import MessagingInterface from '@/components/messaging-interface';
import NotificationBell from '@/components/notification-bell';

interface Course {
  id: number;
  title: string;
  description: string;
  student_count?: number;
  content_count?: number;
  created_at: string;
}

interface CourseContent {
  id: number;
  title: string;
  description: string;
  content_type: string;
  file_path?: string;
  file_size?: number;
  page_count?: number;
  created_at: string;
  file_metadata?: any;
  generated_content?: string;
}

interface Student {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  cscs_card_number: string | null;
  is_active: boolean;
}

export default function InstructorsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<CourseContent[]>([]);
  
  // Debug selected course changes
  useEffect(() => {
    console.log('Selected course changed:', selectedCourse);
  }, [selectedCourse]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showTweakModal, setShowTweakModal] = useState(false);
  const [showGeneratedContentModal, setShowGeneratedContentModal] = useState(false);
  const [showContentBuilder, setShowContentBuilder] = useState(false);
  const [showCourseCreation, setShowCourseCreation] = useState(false);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null as File | null
  });
  const [accessData, setAccessData] = useState({
    student_id: '',
    action: 'grant' // 'grant' or 'revoke'
  });
  const [tweakData, setTweakData] = useState({
    content_type: 'learning_material', // learning_material, lesson_plan, test
    title: '',
    description: '',
    additional_instructions: ''
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    checkAuth();
    loadCourses();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    console.log('Checking auth, token exists:', !!token);
    if (token) {
      setIsLoggedIn(true);
      // In a real app, you'd decode the JWT to get user info
      setUser({ role: 'instructor', email: 'instructor@example.com' });
      console.log('User logged in successfully');
    } else {
      setIsLoggedIn(false);
      setUser(null);
      console.log('No token found, user not logged in');
    }
  };

  const loadCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading courses with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${api.baseUrl}/api/courses/instructor-dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Courses API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Courses data received:', data.length, 'courses');
        setCourses(data);
      } else {
        const errorText = await response.text();
        console.error('Courses API error:', response.status, errorText);
        // If unauthorized, redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleCourseCreated = (newCourse: any) => {
    // Add the new course to the list
    setCourses(prev => [newCourse, ...prev]);
    setShowCourseCreation(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const loadCourseContent = async (courseId: number) => {
    try {
      console.log('Loading content for course:', courseId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(api.courses.getContent(courseId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Content API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Content data received:', data.length, 'items');
        setCourseContent(data);
      } else {
        const errorText = await response.text();
        console.error('Content API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading course content:', error);
    }
  };

  const loadCourseStudents = async (courseId: number) => {
    try {
      console.log('Loading students for course:', courseId);
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Yes' : 'No');
      
      const response = await fetch(`${api.baseUrl}/api/courses/${courseId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Students data received:', data);
        setStudents(data.students);
        console.log('Students state updated with', data.students.length, 'students');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadAvailableStudents = async (courseId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.baseUrl}/api/courses/${courseId}/available-students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.students);
      } else {
        console.error('Error loading available students');
      }
    } catch (error) {
      console.error('Error loading available students:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;
    
    let courseToUse = selectedCourse;
    
    // If no course is selected, create a default course first
    if (!courseToUse) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('${api.baseUrl}/api/courses/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: uploadData.title || 'New Course',
            description: uploadData.description || 'Course created for PDF upload',
            category: 'General',
            duration_hours: 1,
            status: 'published',
            is_active: true
          })
        });
        
        if (response.ok) {
          const newCourse = await response.json();
          setSelectedCourse(newCourse);
          courseToUse = newCourse;
        } else {
          alert('Error creating course');
          return;
        }
      } catch (error) {
        console.error('Error creating course:', error);
        alert('Error creating course');
        return;
      }
    }

    // Ensure we have a valid course with an ID
    if (!courseToUse || !courseToUse.id) {
      alert('No course selected for upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('course_id', courseToUse.id.toString());
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);

    try {
      const token = localStorage.getItem('token');
      console.log('Uploading PDF with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${api.baseUrl}/api/instructor-ai/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('Upload API response status:', response.status);

      if (response.ok) {
        setShowUploadModal(false);
        setUploadData({ title: '', description: '', file: null });
        loadCourses(); // This will refresh metrics
        if (selectedCourse) {
          loadCourseContent(selectedCourse.id); // Refresh content for selected course
        }
        alert('PDF uploaded successfully!');
      } else {
        const errorText = await response.text();
        console.error('Upload error:', response.status, errorText);
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          alert(`Error uploading PDF: ${response.status} ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading PDF');
    }
  };

  const handleAccessControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const endpoint = accessData.action === 'grant' 
      ? `${api.baseUrl}/api/courses/${selectedCourse.id}/grant-access`
      : `${api.baseUrl}/api/courses/${selectedCourse.id}/revoke-access`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          student_id: parseInt(accessData.student_id),
          course_id: selectedCourse.id
        })
      });

      if (response.ok) {
        setShowAccessModal(false);
        setAccessData({ student_id: '', action: 'grant' });
        loadCourseStudents(selectedCourse.id);
        alert(`Access ${accessData.action === 'grant' ? 'granted' : 'revoked'} successfully!`);
      } else {
        alert(`Error ${accessData.action === 'grant' ? 'granting' : 'revoking'} access`);
      }
    } catch (error) {
      console.error('Error managing access:', error);
      alert('Error managing access');
    }
  };

  const handleAssignStudent = async (studentId: number) => {
    if (!selectedCourse) return;

    try {
      console.log(`Assigning student ${studentId} to course ${selectedCourse.id}`);
      
      const response = await fetch(`${api.baseUrl}/api/courses/${selectedCourse.id}/grant-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: selectedCourse.id
        })
      });

      console.log('Assignment API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Assignment successful:', result);
        setShowAssignModal(false);
        loadCourseStudents(selectedCourse.id);
        loadAvailableStudents(selectedCourse.id);
        loadCourses(); // Refresh course metrics
        alert('Student assigned to course successfully!');
      } else {
        const errorText = await response.text();
        console.error('Assignment error:', response.status, errorText);
        alert(`Error assigning student to course: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      alert('Error assigning student to course');
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedCourse) return;

    try {
      console.log(`Removing student ${studentId} from course ${selectedCourse.id}`);
      
      const response = await fetch(`${api.baseUrl}/api/courses/${selectedCourse.id}/revoke-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: selectedCourse.id
        })
      });

      console.log('Remove API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Removal successful:', result);
        loadCourseStudents(selectedCourse.id);
        loadAvailableStudents(selectedCourse.id);
        loadCourses(); // Refresh course metrics
        alert('Student removed from course successfully!');
      } else {
        const errorText = await response.text();
        console.error('Removal error:', response.status, errorText);
        alert(`Error removing student from course: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Error removing student from course');
    }
  };

  const createKnowledgeTest = async (contentId: number) => {
    try {
      const response = await fetch(api.courses.createTest(selectedCourse?.id || 0, contentId), {
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
        loadCourseContent(selectedCourse?.id || 0);
      } else {
        alert('Error creating knowledge test');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Error creating knowledge test');
    }
  };

  const handleContentTweak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContent || !selectedCourse) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.baseUrl}/api/course-management/${selectedCourse.id}/content/${selectedContent.id}/tweak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content_type: tweakData.content_type,
          title: tweakData.title,
          description: tweakData.description,
          additional_instructions: tweakData.additional_instructions
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${tweakData.content_type.replace('_', ' ')} created successfully!`);
        setShowTweakModal(false);
        setTweakData({
          content_type: 'learning_material',
          title: '',
          description: '',
          additional_instructions: ''
        });
        loadCourseContent(selectedCourse.id);
      } else {
        const errorText = await response.text();
        alert(`Error creating ${tweakData.content_type}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error tweaking content:', error);
      alert('Error creating content');
    }
  };

  const viewContent = async (content: CourseContent) => {
    if (!selectedCourse) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(api.courses.viewContent(selectedCourse.id, content.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Open PDF in new tab
        window.open(data.viewer_url, '_blank');
      } else {
        alert('Error viewing content');
      }
    } catch (error) {
      console.error('Error viewing content:', error);
      alert('Error viewing content');
    }
  };

  const viewGeneratedContent = async (content: CourseContent) => {
    if (!selectedCourse) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${api.baseUrl}/api/course-management/${selectedCourse.id}/content/${content.id}/generated-content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Show generated content in a modal
        setSelectedContent({...content, generated_content: data.generated_content});
        setShowGeneratedContentModal(true);
      } else {
        alert('Error loading generated content');
      }
    } catch (error) {
      console.error('Error loading generated content:', error);
      alert('Error loading generated content');
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Instructor Login Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please log in to access the instructor dashboard.</p>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPath="/instructors" />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumb 
            items={[
              { label: 'Instructor Dashboard' }
            ]}
            className="mb-4"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
                <p className="text-gray-600">Manage your courses and student access</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              {user && (
                <NotificationBell currentUserId={user.id} />
              )}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Course "{selectedCourse?.title}" selected! Scroll down to manage students.
              </p>
            </div>
          </div>
        )}

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
                    {courses.reduce((sum, course) => sum + (course.student_count || 0), 0)}
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
                    {courses.reduce((sum, course) => sum + (course.content_count || 0), 0)}
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

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF Course
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCourseCreation(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
                <Button variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  Create Knowledge Test
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const element = document.getElementById('messaging-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages & Q&A
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div id="courses-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className={`hover:shadow-lg transition-all duration-200 ${
                selectedCourse?.id === course.id 
                  ? 'ring-2 ring-blue-500 shadow-lg border-blue-300' 
                  : 'hover:shadow-lg'
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{course.title}</span>
                  <Button
                    onClick={() => {
                      console.log('View button clicked for course:', course);
                      // Show course details in a modal or alert for now
                      alert(`Course Details:\nTitle: ${course.title}\nDescription: ${course.description}\nCreated: ${new Date(course.created_at).toLocaleDateString()}`);
                    }}
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
                  <span>{course.student_count || 0} students</span>
                  <span>{course.content_count || 0} items</span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Manage button clicked for course:', course);
                      console.log('Course ID:', course.id);
                      setSelectedCourse(course);
                      loadCourseStudents(course.id);
                      loadCourseContent(course.id);
                      loadAvailableStudents(course.id);
                      setShowSuccessMessage(true);
                      // Hide success message after 3 seconds
                      setTimeout(() => setShowSuccessMessage(false), 3000);
                      // Scroll to the selected course details section
                      setTimeout(() => {
                        const element = document.getElementById('selected-course-details');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    size="sm"
                    className={`flex-1 ${
                      selectedCourse?.id === course.id 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {selectedCourse?.id === course.id ? 'Managing' : 'Manage'}
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('Upload button clicked for course:', course);
                      setSelectedCourse(course);
                      setShowUploadModal(true);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`${api.baseUrl}/api/courses/${course.id}/publish`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        
                        if (response.ok) {
                          alert('Course published successfully!');
                          loadCourses(); // Refresh the courses list
                        } else {
                          alert('Error publishing course');
                        }
                      } catch (error) {
                        console.error('Error publishing course:', error);
                        alert('Error publishing course');
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    title="Publish Course"
                  >
                    📢
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Course Details */}
        {selectedCourse && (
          <div className="space-y-6">
            {/* Course Content Section */}
            <Card id="selected-course-details" className="border-2 border-blue-500 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-blue-800">
                    📚 {selectedCourse.title} - Course Content
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowUploadModal(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Content
                    </Button>
                    <Button
                      onClick={() => setShowContentModal(true)}
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View All Content
                    </Button>
                    <Button
                      onClick={() => setShowContentBuilder(true)}
                      size="sm"
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      AI Content Builder
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseContent.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courseContent.map((content) => (
                        <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm truncate">{content.title}</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {content.content_type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{content.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>{content.page_count ? `${content.page_count} pages` : 'N/A'}</span>
                            <span>{new Date(content.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex space-x-2">
                            {content.content_type === 'pdf' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewContent(content)}
                                className="flex-1 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View PDF
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewGeneratedContent(content)}
                                className="flex-1 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Content
                              </Button>
                            )}
                            {content.content_type === 'pdf' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedContent(content);
                                  setTweakData({
                                    content_type: 'learning_material',
                                    title: `Learning Material - ${content.title}`,
                                    description: `Generated from ${content.title}`,
                                    additional_instructions: ''
                                  });
                                  setShowTweakModal(true);
                                }}
                                className="flex-1 text-xs"
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Tweak
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No content uploaded yet.</p>
                      <p className="text-sm">Upload PDFs and other materials to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Student Management Section */}
            <Card className="border-2 border-green-500 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-green-800">
                    👥 {selectedCourse.title} - Student Management
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowAssignModal(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Students
                    </Button>
                    <Button
                      onClick={() => setShowAccessModal(true)}
                      size="sm"
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Access
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 mb-2">
                    Debug: {students.length} students loaded
                  </div>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          <p className="text-sm text-gray-500">
                            CSCS: {student.cscs_card_number || 'Not provided'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No students enrolled in this course yet.</p>
                      <p className="text-sm">Use "Manage Access" to add students.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Request Management */}
        <Card className="border-2 border-purple-500 shadow-lg">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center justify-between">
              <span className="text-purple-800">
                📝 Course Access Requests
              </span>
              <div className="text-sm text-purple-600">
                Manage student requests for course access
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CourseRequestManagement />
          </CardContent>
        </Card>

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

        {/* Assign Students Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Assign Students to {selectedCourse?.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignModal(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Select students to assign to this course. They will receive course-specific login access.
                  </p>
                  
                  {availableStudents.length > 0 ? (
                    <div className="grid gap-3">
                      {availableStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                            <p className="text-sm text-gray-500">
                              CSCS: {student.cscs_card_number || 'Not provided'}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleAssignStudent(student.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No available students to assign.</p>
                      <p className="text-sm">All students may already be enrolled in this course.</p>
                    </div>
                  )}
                </div>
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

        {/* Content View Modal */}
        {showContentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Course Content - {selectedCourse?.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContentModal(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseContent.map((content) => (
                    <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{content.title}</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {content.content_type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-3">{content.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{content.page_count ? `${content.page_count} pages` : 'N/A'}</span>
                        <span>{new Date(content.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex space-x-2">
                        {content.content_type === 'pdf' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewContent(content)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View PDF
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewGeneratedContent(content)}
                            className="flex-1 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Content
                          </Button>
                        )}
                        {content.content_type === 'pdf' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContent(content);
                              setTweakData({
                                content_type: 'learning_material',
                                title: `Learning Material - ${content.title}`,
                                description: `Generated from ${content.title}`,
                                additional_instructions: ''
                              });
                              setShowTweakModal(true);
                              setShowContentModal(false);
                            }}
                            className="flex-1 text-xs"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Tweak
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Tweak Modal */}
        {showTweakModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tweak Content - {selectedContent?.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTweakModal(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContentTweak} className="space-y-4">
                  <div>
                    <Label htmlFor="content_type">Content Type</Label>
                    <select
                      id="content_type"
                      value={tweakData.content_type}
                      onChange={(e) => setTweakData({...tweakData, content_type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="learning_material">Learning Material</option>
                      <option value="lesson_plan">Lesson Plan</option>
                      <option value="test">Knowledge Test</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="tweak_title">Title</Label>
                    <Input
                      id="tweak_title"
                      value={tweakData.title}
                      onChange={(e) => setTweakData({...tweakData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tweak_description">Description</Label>
                    <Textarea
                      id="tweak_description"
                      value={tweakData.description}
                      onChange={(e) => setTweakData({...tweakData, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="additional_instructions">Additional Instructions</Label>
                    <Textarea
                      id="additional_instructions"
                      value={tweakData.additional_instructions}
                      onChange={(e) => setTweakData({...tweakData, additional_instructions: e.target.value})}
                      placeholder="Specify any additional requirements or instructions for generating this content..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Generate {tweakData.content_type.replace('_', ' ')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTweakModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generated Content Modal */}
        {showGeneratedContentModal && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedContent.title} - Generated Content</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGeneratedContentModal(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[70vh]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Content Type: {selectedContent.content_type.replace('_', ' ')}</span>
                    <span>Generated: {new Date(selectedContent.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                      {selectedContent.generated_content || 'No generated content available'}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content Builder Modal */}
        {showContentBuilder && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Content Builder - {selectedCourse.title}
                </h2>
                <Button
                  onClick={() => setShowContentBuilder(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <CourseContentBuilder 
                  courseId={selectedCourse.id} 
                  onContentUpdate={() => {
                    loadCourseContent(selectedCourse.id);
                    setShowContentBuilder(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Course Creation Modal */}
        {showCourseCreation && (
          <CourseCreationForm
            onCourseCreated={handleCourseCreated}
            onCancel={() => setShowCourseCreation(false)}
            isModal={true}
          />
        )}

        {/* Messaging & Q&A Section */}
        <div id="messaging-section" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages & Q&A
              </CardTitle>
              <p className="text-gray-600">Communicate with students and manage course discussions</p>
            </CardHeader>
            <CardContent>
              {user && (
                <MessagingInterface 
                  userRole="instructor" 
                  currentUserId={user.id} 
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

