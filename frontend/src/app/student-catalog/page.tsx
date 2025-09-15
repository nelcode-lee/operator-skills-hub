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
  Eye,
  Wrench,
  Shield,
  Satellite,
  MapPin,
  Building,
  DoorOpen,
  FileText,
  Target
} from 'lucide-react';
import NextImage from 'next/image';
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

  const getCourseThumbnail = (course: Course) => {
    // Return relevant thumbnail based on course title/category
    const title = course.title.toLowerCase();
    const category = course.category?.toLowerCase() || '';
    
    // Plant Training & Equipment courses
    if (title.includes('plant') || title.includes('excavator') || title.includes('dumper') || 
        title.includes('crane') || title.includes('loader') || title.includes('bulldozer') ||
        title.includes('forward tipping')) {
      return '/images/equipment/forward-tipping-dumper.png';
    }
    
    // Health & Safety courses
    if (title.includes('health') || title.includes('safety') || title.includes('h&s') || 
        category.includes('health') || category.includes('safety')) {
      return '/images/courses/H&S.webp';
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

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    switch (cat) {
      case 'plant training': return <Wrench className="h-5 w-5" />;
      case 'health & safety': return <Shield className="h-5 w-5" />;
      case 'gps training': return <Satellite className="h-5 w-5" />;
      case 'utility detection': return <MapPin className="h-5 w-5" />;
      case 'streetworks': return <Building className="h-5 w-5" />;
      case 'site safety': return <DoorOpen className="h-5 w-5" />;
      case 'nocn': return <FileText className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
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
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">All Available Courses</h1>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          All our courses are carefully planned and scheduled throughout the year to ensure you have access to training on a regular basis.
        </p>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              {/* Category Header with Icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getCategoryIcon(course.category)}
                  </div>
                  <span className="text-sm font-medium text-blue-600">{course.category}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">4.8</span>
                </div>
              </div>
              
              {/* Course Image */}
              <div className="mb-4">
                <NextImage
                  src={getCourseThumbnail(course)}
                  alt={course.title}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              {/* Course Title and Description */}
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
              {/* Duration and People Trained */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration_hours || '1-5'} Days</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>2,500 trained</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">From</span>
                <span className="text-lg font-bold text-green-600">£200</span>
              </div>

              {course.status === 'available' && (
                <Button
                  onClick={() => handleEnroll(course.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <span>View Details</span>
                  <span className="ml-2">→</span>
                </Button>
              )}

              {course.status === 'active' && (
                <Button
                  onClick={() => window.location.href = `/student-portal?course=${course.id}`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              )}

              {course.status === 'completed' && (
                <Button
                  onClick={() => window.location.href = `/student-portal?course=${course.id}`}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Course
                </Button>
              )}

              {course.status === 'paused' && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
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














