"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Maximize,
  Download,
  CheckCircle,
  Clock,
  BookOpen,
  Video,
  FileText,
  Image,
  Award,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Settings,
  SkipBack,
  SkipForward,
  Fullscreen
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface Content {
  id: number;
  title: string;
  content_type: 'pdf' | 'video' | 'image' | 'interactive' | 'test';
  description: string;
  file_path?: string;
  duration_minutes?: number;
  is_completed: boolean;
  completion_percentage: number;
  course_id: number;
  course_title: string;
  page_count?: number;
  file_size?: number;
}

interface LearningSession {
  id: number;
  started_at: string;
  duration_minutes: number;
  progress_percentage: number;
}

interface VideoControls {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
}

interface ImageControls {
  zoom: number;
  rotation: number;
  currentIndex: number;
  totalImages: number;
}

export default function ContentViewer() {
  const params = useParams();
  const router = useRouter();
  const contentId = params?.contentId ? parseInt(params.contentId as string) : null;
  
  const [content, setContent] = useState<Content | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Video controls
  const [videoControls, setVideoControls] = useState<VideoControls>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isFullscreen: false
  });
  
  // Image controls
  const [imageControls, setImageControls] = useState<ImageControls>({
    zoom: 100,
    rotation: 0,
    currentIndex: 0,
    totalImages: 1
  });
  
  // PDF controls
  const [pdfControls, setPdfControls] = useState({
    currentPage: 1,
    zoom: 100,
    rotation: 0
  });
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<Date>(new Date());

  // Swipe gestures for mobile navigation
  const swipeGestures = useSwipeGestures({
    onSwipeLeft: () => {
      if (content?.content_type === 'pdf') {
        handlePdfPageChange(pdfControls.currentPage + 1);
      }
    },
    onSwipeRight: () => {
      if (content?.content_type === 'pdf') {
        handlePdfPageChange(pdfControls.currentPage - 1);
      }
    },
    onSwipeUp: () => {
      setShowControls(true);
    },
    onSwipeDown: () => {
      setShowControls(false);
    }
  });

  useEffect(() => {
    if (contentId) {
      loadContent();
      startLearningSession();
    }
  }, [contentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  const loadContent = async () => {
    if (!contentId) {
      setError('Invalid content ID');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/learning/content/${contentId}/view`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        setError('Failed to load content');
      }
    } catch (err) {
      setError('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const startLearningSession = async () => {
    if (!contentId) return;
    
    try {
      const response = await fetch(`${api.baseUrl}/api/learning/sessions/start`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content_id: contentId
        })
      });

      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
      }
    } catch (err) {
      console.error('Failed to start learning session:', err);
    }
  };

  const endLearningSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${api.baseUrl}/api/learning/sessions/${session.id}/end`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration_minutes: Math.floor(sessionTime / 60),
          progress_percentage: 100 // Assuming completion when ending session
        })
      });

      if (response.ok) {
        // Mark content as completed
        if (content) {
          setContent(prev => prev ? { ...prev, is_completed: true, completion_percentage: 100 } : null);
        }
      }
    } catch (err) {
      console.error('Failed to end learning session:', err);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'pdf': return <FileText className="h-6 w-6" />;
      case 'video': return <Video className="h-6 w-6" />;
      case 'image': return <Image className="h-6 w-6" />;
      case 'test': return <Award className="h-6 w-6" />;
      default: return <BookOpen className="h-6 w-6" />;
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

  // Video control functions
  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (videoControls.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoControls(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const handleVideoSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setVideoControls(prev => ({ ...prev, currentTime: time }));
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setVideoControls(prev => ({ ...prev, volume, isMuted: volume === 0 }));
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setVideoControls(prev => ({ ...prev, playbackRate: rate }));
    }
  };

  const handleVideoFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setVideoControls(prev => ({ ...prev, isFullscreen: true }));
      } else {
        document.exitFullscreen();
        setVideoControls(prev => ({ ...prev, isFullscreen: false }));
      }
    }
  };

  // Image control functions
  const handleImageZoom = (zoom: number) => {
    setImageControls(prev => ({ ...prev, zoom: Math.max(25, Math.min(300, zoom)) }));
  };

  const handleImageRotate = () => {
    setImageControls(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleImageReset = () => {
    setImageControls(prev => ({ ...prev, zoom: 100, rotation: 0 }));
  };

  // PDF control functions
  const handlePdfPageChange = (page: number) => {
    if (content?.page_count && page >= 1 && page <= content.page_count) {
      setPdfControls(prev => ({ ...prev, currentPage: page }));
    }
  };

  const handlePdfZoom = (zoom: number) => {
    setPdfControls(prev => ({ ...prev, zoom: Math.max(50, Math.min(300, zoom)) }));
  };

  const handlePdfRotate = () => {
    setPdfControls(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  // General functions
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const renderContent = () => {
    if (!content) return null;

    switch (content.content_type) {
      case 'pdf':
        return (
          <div className="w-full h-full flex flex-col">
            {/* PDF Controls */}
            <div className="bg-white border-b p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2">
                  <Button
                    onClick={() => handlePdfPageChange(pdfControls.currentPage - 1)}
                    disabled={pdfControls.currentPage <= 1}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 touch-manipulation"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <input
                      type="number"
                      value={pdfControls.currentPage}
                      onChange={(e) => handlePdfPageChange(parseInt(e.target.value) || 1)}
                      className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded text-center touch-manipulation"
                      min={1}
                      max={content.page_count || 1}
                    />
                    <span className="text-xs sm:text-sm text-gray-500">/ {content.page_count || 1}</span>
                  </div>
                  
                  <Button
                    onClick={() => handlePdfPageChange(pdfControls.currentPage + 1)}
                    disabled={pdfControls.currentPage >= (content.page_count || 1)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 touch-manipulation"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                  <Button onClick={() => handlePdfZoom(pdfControls.zoom - 25)} variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2 touch-manipulation">
                    <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm text-gray-600 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                    {pdfControls.zoom}%
                  </span>
                  <Button onClick={() => handlePdfZoom(pdfControls.zoom + 25)} variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2 touch-manipulation">
                    <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button onClick={handlePdfRotate} variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2 touch-manipulation">
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto">
              <iframe
                src={api.courses.pdfViewer(content.course_id, content.id, localStorage.getItem('token') || '')}
                className="w-full h-full border-0"
                style={{ 
                  transform: `scale(${pdfControls.zoom / 100}) rotate(${pdfControls.rotation}deg)`,
                  transformOrigin: 'top center'
                }}
                title={`PDF Viewer - ${content.title}`}
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onPlay={() => setVideoControls(prev => ({ ...prev, isPlaying: true }))}
              onPause={() => setVideoControls(prev => ({ ...prev, isPlaying: false }))}
              onTimeUpdate={(e) => setVideoControls(prev => ({ ...prev, currentTime: e.currentTarget.currentTime }))}
              onLoadedMetadata={(e) => setVideoControls(prev => ({ ...prev, duration: e.currentTarget.duration }))}
              onVolumeChange={(e) => setVideoControls(prev => ({ ...prev, volume: e.currentTarget.volume }))}
            >
              <source src={content.file_path} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video Controls Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              {/* Progress Bar */}
              <div className="mb-3 sm:mb-4">
                <Slider
                  value={[videoControls.currentTime]}
                  onValueChange={([value]) => handleVideoSeek(value)}
                  max={videoControls.duration}
                  step={0.1}
                  className="w-full touch-manipulation"
                />
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(videoControls.currentTime)}</span>
                  <span>{formatTime(videoControls.duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
                  <Button onClick={handleVideoPlayPause} variant="ghost" size="sm" className="text-white h-10 w-10 sm:h-9 sm:w-auto sm:px-3 touch-manipulation">
                    {videoControls.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  
                  <Button onClick={() => handleVideoSeek(videoControls.currentTime - 10)} variant="ghost" size="sm" className="text-white h-8 w-8 sm:h-9 sm:w-auto sm:px-2 touch-manipulation">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button onClick={() => handleVideoSeek(videoControls.currentTime + 10)} variant="ghost" size="sm" className="text-white h-8 w-8 sm:h-9 sm:w-auto sm:px-2 touch-manipulation">
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <div className="hidden sm:flex items-center space-x-2 ml-4">
                    <Volume2 className="h-4 w-4 text-white" />
                    <Slider
                      value={[videoControls.volume * 100]}
                      onValueChange={([value]) => handleVolumeChange(value / 100)}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-end space-x-2">
                  <select
                    value={videoControls.playbackRate}
                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                    className="bg-black/50 text-white text-xs sm:text-sm rounded px-2 py-1 touch-manipulation"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>

                  <Button onClick={handleVideoFullscreen} variant="ghost" size="sm" className="text-white h-8 w-8 sm:h-9 sm:w-auto sm:px-2 touch-manipulation">
                    <Fullscreen className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full flex flex-col">
            {/* Image Controls */}
            <div className="bg-white border-b p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button onClick={() => handleImageZoom(imageControls.zoom - 25)} variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {imageControls.zoom}%
                </span>
                <Button onClick={() => handleImageZoom(imageControls.zoom + 25)} variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={handleImageRotate} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={handleImageReset} variant="outline" size="sm">
                  Reset
                </Button>
              </div>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100">
              <img
                ref={imageRef}
                src={content.file_path}
                alt={content.title}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${imageControls.zoom / 100}) rotate(${imageControls.rotation}deg)`,
                  transformOrigin: 'center'
                }}
              />
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Interactive Content</h3>
              <p className="text-gray-600">This interactive content will be available soon!</p>
            </div>
          </div>
        );

      case 'test':
        return (
          <div className="w-full h-full flex items-center justify-center bg-green-50">
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-semibold mb-2">Knowledge Test</h3>
              <p className="text-gray-600">Test functionality will be available soon!</p>
              <Button 
                onClick={() => router.push(`/student-portal/test/${contentId}`)}
                className="mt-4"
              >
                Start Test
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">Content type not supported</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Content not found'}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen flex flex-col bg-gray-50"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={swipeGestures.onTouchStart as any}
      onTouchMove={swipeGestures.onTouchMove as any}
      onTouchEnd={swipeGestures.onTouchEnd}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {getContentIcon(content.content_type)}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{content.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{content.course_title}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
            {session && (
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Session: </span>
                <span>{formatTime(sessionTime)}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {content.is_completed && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                </Badge>
              )}
              
              <Button
                onClick={handleFullscreen}
                variant="outline"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1">Fullscreen</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Progress:</span>
          <Progress value={content.completion_percentage} className="flex-1 h-2" />
          <span className="text-sm text-gray-600">{content.completion_percentage}%</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardContent className="h-full p-0">
            {renderContent()}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {content.duration_minutes && (
              <span>Estimated time: {content.duration_minutes} minutes</span>
            )}
            {content.file_size && (
              <span className="ml-4">File size: {(content.file_size / 1024 / 1024).toFixed(1)} MB</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              Back to Course
            </Button>
            
            {!content.is_completed && (
              <Button
                onClick={endLearningSession}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
