"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Clock,
  Maximize,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';

interface WorkbookSection {
  page: number;
  title: string;
  content: string;
  images: string[];
  type: string;
  order: number;
}

interface WorkbookContent {
  title: string;
  description: string;
  content_type: string;
  sections: WorkbookSection[];
}

interface WebWorkbookViewerProps {
  courseId: number;
  onClose?: () => void;
}

export default function WebWorkbookViewer({ courseId, onClose }: WebWorkbookViewerProps) {
  const [content, setContent] = useState<WorkbookContent | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadWorkbookContent();
  }, [courseId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadWorkbookContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${api.baseUrl}/api/courses/${courseId}/web-content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to load workbook content');
      }
    } catch (err) {
      setError('Error loading workbook content');
    } finally {
      setLoading(false);
    }
  };

  const nextSection = () => {
    if (content && currentSection < content.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const goToSection = (sectionIndex: number) => {
    if (content && sectionIndex >= 0 && sectionIndex < content.sections.length) {
      setCurrentSection(sectionIndex);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  const downloadWorkbook = () => {
    // Create a downloadable version of the workbook
    if (!content || typeof window === 'undefined') return;
    
    const workbookText = content.sections.map((section, index) => 
      `Section ${index + 1}: ${section.title}\n\n${section.content}\n\n`
    ).join('\n');
    
    const blob = new Blob([workbookText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workbook.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workbook...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Workbook not found'}</p>
          <Button onClick={onClose} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const currentSectionData = content.sections[currentSection];
  const progress = ((currentSection + 1) / content.sections.length) * 100;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-full'} flex flex-col`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="bg-teal-100 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-teal-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
                {content.title}
              </h1>
              <p className="text-sm text-gray-500 truncate">
                {content.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Session: {formatTime(sessionTime)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button onClick={downloadWorkbook} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              <Button onClick={toggleFullscreen} variant="outline" size="sm">
                <Maximize className="h-4 w-4" />
              </Button>
              
              {onClose && (
                <Button onClick={onClose} variant="outline" size="sm">
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Progress:</span>
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          <Badge variant="outline" className="text-xs">
            {currentSection + 1} of {content.sections.length} sections
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <Button
            onClick={prevSection}
            disabled={currentSection === 0}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Section:</span>
            <select
              value={currentSection}
              onChange={(e) => goToSection(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {content.sections.map((section, index) => (
                <option key={index} value={index}>
                  {index + 1}. {section.title.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={nextSection}
            disabled={currentSection === content.sections.length - 1}
            variant="outline"
            size="sm"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <span>Section {currentSection + 1}: {currentSectionData.title}</span>
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Badge variant="secondary">Page {currentSectionData.page}</Badge>
                <Badge variant="outline">{currentSectionData.type}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Images */}
              {currentSectionData.images && currentSectionData.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSectionData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Section ${currentSection + 1} - Image ${index + 1}`}
                        className="w-full h-auto rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="h-3 w-3 inline mr-1" />
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Text Content */}
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {currentSectionData.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Interactive Workbook</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentSection + 1} of {content.sections.length} sections
              </span>
              <Button
                onClick={() => goToSection(0)}
                variant="outline"
                size="sm"
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
