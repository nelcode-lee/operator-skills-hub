"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { api } from '@/lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Clock,
  BookOpen,
  CheckCircle
} from 'lucide-react';

interface PDFViewerProps {
  contentId: number;
  courseId: number;
  title: string;
  pageCount: number;
  sessionId?: string;
  onSessionEnd?: (sessionId: string) => void;
}

export default function PDFViewer({ 
  contentId, 
  courseId, 
  title, 
  pageCount, 
  sessionId,
  onSessionEnd 
}: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(!!sessionId);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const pageRef = useRef<any>(null);
  const sessionStartTime = useRef<Date>(new Date());

  // Track session time
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000);
      setSessionTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Load PDF
  useEffect(() => {
    loadPDF();
  }, [contentId]);

  const loadPDF = async () => {
    try {
      setIsLoading(true);
      // PDF will be loaded via iframe
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const downloadPDF = () => {
    // Implement PDF download
    const token = localStorage.getItem('token');
    const link = document.createElement('a');
    link.href = api.courses.pdfDownload(courseId, contentId, token || undefined);
    link.download = `${title}.pdf`;
    link.click();
  };

  const endSession = async () => {
    if (sessionId && onSessionEnd) {
      try {
        await fetch(`${api.baseUrl}/api/courses/${courseId}/content/${contentId}/end-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ session_id: sessionId })
        });
        
        onSessionEnd(sessionId);
        setIsSessionActive(false);
      } catch (error) {
        console.error('Error ending session:', error);
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">Page {currentPage} of {pageCount}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isSessionActive && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Session: {formatTime(sessionTime)}</span>
              </div>
            )}
            
            <Button
              onClick={downloadPDF}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={prevPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                min={1}
                max={pageCount}
              />
              <span className="text-sm text-gray-500">/ {pageCount}</span>
            </div>
            
            <Button
              onClick={nextPage}
              disabled={currentPage === pageCount}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={zoomOut}
              variant="outline"
              size="sm"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {zoom}%
            </span>
            
            <Button
              onClick={zoomIn}
              variant="outline"
              size="sm"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={rotate}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div className="relative">
                {/* PDF Viewer */}
                <iframe
                  src={api.courses.pdfViewer(courseId, contentId, localStorage.getItem('token') || undefined)}
                  className="w-full border-0"
                  style={{ 
                    height: '800px',
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'top center'
                  }}
                  title={`PDF Viewer - ${title}`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Responsive PDF Viewer - Optimized for all screen sizes
          </div>
          
          {isSessionActive && (
            <Button
              onClick={endSession}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              End Learning Session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

