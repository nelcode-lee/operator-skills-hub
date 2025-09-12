'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, CheckCircle, Circle, Brain, Image as ImageIcon, ChevronDown, ChevronRight, ArrowLeft, Menu, X } from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';
import KnowledgeTest from '@/components/KnowledgeTest';
import TimeTracker from '@/components/TimeTracker';
import Navigation from '@/components/navigation';
import './learning-page.css';

// Function to get course images from API
const getCourseImages = async (courseId: number, page: number) => {
  try {
    const response = await fetch(`${api.baseUrl}/api/courses/${courseId}/images?page=${page}`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const images = await response.json();
      return images;
    }
  } catch (error) {
    console.error('Error fetching course images:', error);
  }
  
  // Fallback to default images if API fails
  const defaultImages: { [key: number]: Array<{ src: string; alt: string }> } = {
    1: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper in Action' },
      { src: '/images/courses/plant-training.jpg', alt: 'Plant Training Overview' },
      { src: '/images/equipment/excavator-training.jpg', alt: 'Excavator Training' }
    ],
    2: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper Training' },
      { src: '/images/courses/plant-training.jpg', alt: 'Forward Tipping Dumper Training' },
      { src: '/images/equipment/safety-gear.jpg', alt: 'Safety Equipment' }
    ],
    3: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper Skills Bootcamp' },
      { src: '/images/courses/plant-training.jpg', alt: 'Skills Bootcamp Overview' },
      { src: '/images/facilities/training-hall.jpg', alt: 'Training Facility' }
    ],
    4: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper Safety' },
      { src: '/images/courses/H&S.jpg', alt: 'Health & Safety Training' },
      { src: '/images/equipment/safety-gear.jpg', alt: 'Safety Procedures' }
    ],
    5: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper Operation' },
      { src: '/images/courses/plant-training.jpg', alt: 'Equipment Operation' },
      { src: '/images/equipment/crane-operation.jpg', alt: 'Crane Operation' }
    ],
    6: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper Page 6' },
      { src: '/images/courses/plant-training.jpg', alt: 'Page 6 Content' },
      { src: '/images/equipment/utility-detection.jpg', alt: 'Utility Detection Training' }
    ],
    7: [
      { src: '/images/equipment/forward-tipping-dumper.png', alt: 'Forward Tipping Dumper Page 7' },
      { src: '/images/courses/plant-training.jpg', alt: 'Page 7 Content' },
      { src: '/images/facilities/simulator-room.jpg', alt: 'Simulator Training' }
    ]
  };
  
  return defaultImages[page] || [];
};

interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  content_type: string;
  estimated_duration_minutes: number;
  is_required: boolean;
}

interface ContentItem {
  id: number;
  title: string;
  description: string;
  content_type: string;
  file_path: string;
  file_size: number;
  course_id: number;
  instructor_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface WebContentSection {
  page: number;
  title: string;
  content: string;
  type: string;
  order: number;
}

interface WebContent {
  title: string;
  description: string;
  content_type: string;
  sections: WebContentSection[];
  total_sections: number;
  source_pdf: string;
}

export default function LearningPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  
  const [modules, setModules] = useState<Module[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [webContent, setWebContent] = useState<WebContent | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState<{ [key: number]: boolean }>({});
  const [useWebContent, setUseWebContent] = useState(false);
  const [courseImages, setCourseImages] = useState<Array<{ src: string; alt: string }>>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered, courseId:', courseId);
    if (courseId) {
      loadData();
    } else {
      console.log('No courseId provided');
      setError('No course ID provided');
      setLoading(false);
    }
  }, [courseId]);

  // Load images when content changes
  useEffect(() => {
    if (useWebContent && webContent && currentContentIndex < webContent.sections.length) {
      const currentSection = webContent.sections[currentContentIndex];
      if (currentSection && currentSection.page) {
        loadCourseImages(currentSection.page);
      }
    }
  }, [currentContentIndex, webContent, useWebContent]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to load web content first (converted PDF)
      try {
        console.log('Attempting to load web content...');
        console.log('Course ID:', courseId);
        console.log('API URL:', api.webContent.getContent(parseInt(courseId)));
        
        // Get token manually for debugging
        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        
        const webContentRes = await fetch(api.webContent.getContent(parseInt(courseId)), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Web content response status:', webContentRes.status);
        if (webContentRes.ok) {
          const webContentData = await webContentRes.json();
          console.log('Web content loaded successfully:', webContentData.title);
          setWebContent(webContentData);
          setUseWebContent(true);
          setLoading(false);
          return;
        } else {
          console.log('Web content not available, status:', webContentRes.status);
          const errorText = await webContentRes.text();
          console.log('Error response:', errorText);
        }
      } catch (webError) {
        console.log('Web content not available, falling back to regular content:', webError);
      }
      
      // Fallback to regular content
      const [modulesRes, contentRes] = await Promise.all([
        fetch(api.learning.getModules(parseInt(courseId)), {
          headers: getAuthHeaders(),
        }),
        fetch(api.learning.getContent(parseInt(courseId)), {
          headers: getAuthHeaders(),
        })
      ]);

      if (!modulesRes.ok) {
        throw new Error('Failed to load modules');
      }
      if (!contentRes.ok) {
        throw new Error('Failed to load content');
      }

      const [modulesData, contentData] = await Promise.all([
        modulesRes.json(),
        contentRes.json()
      ]);
      
      setModules(modulesData);
      setContent(contentData);
      setUseWebContent(false);
      
      // Set first module as current
      if (modulesData.length > 0) {
        setCurrentModule(modulesData[0]);
        setCurrentContentIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseImages = async (page: number) => {
    if (!courseId) return;
    
    try {
      const images = await getCourseImages(parseInt(courseId), page);
      setCourseImages(images);
    } catch (error) {
      console.error('Error loading course images:', error);
      setCourseImages([]);
    }
  };



  const selectModule = (module: Module) => {
    setCurrentModule(module);
    setCurrentContentIndex(0);
    setShowTest(false);
  };

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleTestComplete = (score: number, passed: boolean) => {
    if (currentModule && passed) {
      setModuleCompleted(prev => ({
        ...prev,
        [currentModule.id]: true
      }));
    }
    setShowTest(false);
  };

  const startTest = () => {
    setShowTest(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto absolute top-0 left-0"></div>
          </div>
          <div className="mt-6 space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Loading Learning Content</h3>
            <p className="text-gray-600">Preparing your interactive learning experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="text-red-600 text-2xl">⚠️</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button 
            onClick={loadData}
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const currentContent = useWebContent && webContent 
    ? webContent.sections[currentContentIndex] 
    : content[currentContentIndex];
  const totalContent = useWebContent && webContent 
    ? webContent.sections.length 
    : content.length;
  const progress = totalContent > 0 ? ((currentContentIndex + 1) / totalContent) * 100 : 0;

  // Type guards for content
  const isWebContent = (content: any): content is WebContentSection => {
    return content && 'page' in content;
  };

  const isRegularContent = (content: any): content is ContentItem => {
    return content && 'content_type' in content;
  };

  // Debug logging
  console.log('Debug state:', {
    useWebContent,
    webContent: webContent ? { title: webContent.title, sections: webContent.sections.length } : null,
    currentContent,
    totalContent,
    currentContentIndex,
    loading,
    error
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation Header */}
      <Navigation currentPath={`/learning/${courseId}`} />
      
      {/* Simplified Header */}
      <div className="bg-white border-b relative z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {useWebContent ? webContent?.title : 'Learning Course'}
              </h1>
              <p className="text-sm text-gray-500">
                {useWebContent ? `${currentContentIndex + 1} of ${totalContent}` : `${currentModule?.order || 1} of ${modules.length}`} sections
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-center lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="flex items-center gap-2 px-4 py-2"
            >
              <Menu className="h-4 w-4" />
              <span className="text-sm">Menu</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Sidebar - Module Navigation */}
          <div className={`lg:col-span-1 ${isMobileSidebarOpen ? 'fixed top-0 left-0 h-full w-80 z-50 lg:relative lg:top-auto lg:left-auto lg:h-auto lg:w-auto' : 'hidden lg:block'}`}>
            <Card className="border shadow-sm h-full lg:h-auto overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {useWebContent ? 'Sections' : 'Modules'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="lg:hidden p-1 hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {useWebContent ? (
                  // Simplified Web content sections
                  <div className="space-y-1">
                    {webContent?.sections.map((section, index) => (
                      <button
                        key={section.order}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          index === currentContentIndex
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => setCurrentContentIndex(index)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            index === currentContentIndex
                              ? 'bg-blue-600 text-white'
                              : index < currentContentIndex
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {index < currentContentIndex ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{section.title}</div>
                            <div className="text-xs text-gray-500">Page {section.page}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Simplified Regular modules
                  <div className="space-y-1">
                    {modules.map((module, index) => (
                      <button
                        key={module.id}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          currentModule?.id === module.id
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => selectModule(module)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            currentModule?.id === module.id
                              ? 'bg-blue-600 text-white'
                              : moduleCompleted[module.id]
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {moduleCompleted[module.id] ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              module.order
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">{module.title}</div>
                            <div className="text-xs text-gray-500">{module.estimated_duration_minutes} min</div>
                          </div>
                          {module.is_required && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 relative z-10">
            {/* Time Tracker */}
            <div className="mb-4">
              <TimeTracker
                courseId={parseInt(courseId)}
                moduleId={currentModule?.id}
                contentId={isRegularContent(currentContent) ? currentContent.id : undefined}
                onTimeUpdate={(seconds) => {
                  // Optional: Handle time updates
                  console.log('Time updated:', seconds);
                }}
              />
            </div>

            {showTest ? (
              <div className="space-y-4">
                <Card className="border">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg text-gray-900">Knowledge Assessment</CardTitle>
                    <CardDescription className="text-gray-600">
                      Test your understanding of the course material
                    </CardDescription>
                  </CardHeader>
                </Card>
                <KnowledgeTest
                  courseId={parseInt(courseId)}
                  contentId={2} // Use the NOCN FTD content for test generation
                  onComplete={handleTestComplete}
                />
              </div>
            ) : (useWebContent && webContent) || (currentModule && currentContent) ? (
              <div className="space-y-4">

                {/* Simplified Content Display */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900">{currentContent.title}</CardTitle>
                    {useWebContent && isWebContent(currentContent) && (
                      <p className="text-sm text-gray-500">Page {currentContent.page}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    {useWebContent && isWebContent(currentContent) ? (
                      // Simplified Web content display
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {currentContent.content}
                        </div>
                        
                        {/* Simplified Course Images */}
                        {currentContent.page && courseImages.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Images</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {courseImages.map((image, index) => (
                                <div key={index} className="border rounded-lg overflow-hidden">
                                  <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-48 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      ) : isRegularContent(currentContent) ? (
                        // Simplified Regular file content display
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {currentContent.content_type.toUpperCase()}
                            </span>
                            <span className="text-gray-500">
                              {(currentContent.file_size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                          
                          {currentContent.content_type === 'pdf' ? (
                            <div className="border rounded-lg p-6 text-center">
                              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h3>
                              <p className="text-gray-600 mb-4">{currentContent.title}</p>
                              <div className="flex gap-3 justify-center">
                                <Button 
                                  onClick={() => window.open(api.courses.pdfViewer(parseInt(courseId), currentContent.id), '_blank')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  View PDF
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => window.open(api.courses.pdfDownload(parseInt(courseId), currentContent.id), '_blank')}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="border rounded-lg p-6 text-center">
                              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">File Content</h3>
                              <p className="text-gray-600">{currentContent.title}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <p>No content available for this section.</p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    No content available for this course.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
