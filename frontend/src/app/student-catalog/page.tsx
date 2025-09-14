"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Award,
  CheckCircle,
  Play,
  Eye
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_hours: number;
  difficulty_level: string;
  progress_percentage: number;
  enrolled_at: string;
  last_accessed: string;
  status: 'available' | 'active' | 'completed' | 'paused';
}

export default function StudentCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalogData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedCategory, selectedDifficulty]);

  const loadCatalogData = async () => {
    try {
      setLoading(true);
      const [coursesRes, categoriesRes, difficultyRes] = await Promise.all([
        fetch(`${api.baseUrl}/api/learning/available-courses`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/learning/categories`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/learning/difficulty-levels`, {
          headers: getAuthHeaders()
        })
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (difficultyRes.ok) {
        const difficultyData = await difficultyRes.json();
        setDifficultyLevels(difficultyData);
      }
    } catch (err) {
      setError('Failed to load catalog data');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty_level === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId: number) => {
    try {
      const response = await fetch(`${api.baseUrl}/api/learning/enroll/${courseId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Update the course status
        setCourses(prev => 
          prev.map(course => 
            course.id === courseId 
              ? { ...course, status: 'active' as const }
              : course
          )
        );
        alert('Successfully enrolled in course!');
      } else {
        const errorData = await response.json();
        alert(`Enrollment failed: ${errorData.detail}`);
      }
    } catch (err) {
      alert('Error enrolling in course');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Play className="h-4 w-4" />;
      case 'active': return <BookOpen className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Catalog</h1>
          <p className="text-muted-foreground">
            Discover and enroll in construction training courses
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {difficultyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-3">
                    {course.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(course.status)}>
                  {getStatusIcon(course.status)}
                  <span className="ml-1 capitalize">{course.status}</span>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours}h</span>
                </div>
                <Badge className={getDifficultyColor(course.difficulty_level)}>
                  {course.difficulty_level}
                </Badge>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Category:</span> {course.category}
              </div>

              {course.status === 'available' && (
                <Button
                  onClick={() => handleEnroll(course.id)}
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Enroll Now
                </Button>
              )}

              {course.status === 'active' && (
                <Button
                  onClick={() => window.location.href = `/student-portal?course=${course.id}`}
                  className="w-full"
                  variant="outline"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              )}

              {course.status === 'completed' && (
                <Button
                  onClick={() => window.location.href = `/student-portal?course=${course.id}`}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Course
                </Button>
              )}

              {course.status === 'paused' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume Learning
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No courses found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or check back later for new courses.
          </p>
        </div>
      )}
    </div>
  );
}









