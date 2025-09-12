"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  SkipBack,
  SkipForward,
  Settings,
  BookOpen,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';

interface MultimediaViewerProps {
  content: {
    id: number;
    title: string;
    content_type: 'pdf' | 'video' | 'image' | 'interactive';
    file_path?: string;
    course_id: number;
  };
  onComplete?: () => void;
  onExit?: () => void;
}

export default function MultimediaViewer({ content, onComplete, onExit }: MultimediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (content.content_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => setCurrentTime(video.currentTime);
      const handleDurationChange = () => setDuration(video.duration);
      const handleEnded = () => {
        setIsPlaying(false);
        if (onComplete) onComplete();
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [content, onComplete]);

  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (isPlaying && content.content_type === 'video' && videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, isPlaying, content.content_type]);

  const handlePlayPause = () => {
    if (content.content_type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    if (content.content_type === 'video' && videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (content.content_type === 'video' && videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (content.content_type === 'video' && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSkip = (seconds: number) => {
    if (content.content_type === 'video' && videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      handleSeek(newTime);
    }
  };

  const handleZoom = (newZoom: number) => {
    setZoom(Math.max(25, Math.min(200, newZoom)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const renderContent = () => {
    switch (content.content_type) {
      case 'pdf':
        return (
          <div className="w-full h-full relative">
            <iframe
              src={api.courses.pdfViewer(content.course_id, content.id, localStorage.getItem('token') || undefined)}
              className="w-full h-full border-0"
              title={`PDF Viewer - ${content.title}`}
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                onClick={() => handleZoom(zoom - 10)}
                variant="outline"
                size="sm"
              >
                -
              </Button>
              <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-sm rounded">
                {zoom}%
              </span>
              <Button
                onClick={() => handleZoom(zoom + 10)}
                variant="outline"
                size="sm"
              >
                +
              </Button>
              <Button
                onClick={handleRotate}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group"
               onMouseMove={showControlsTemporarily}
               onMouseLeave={() => setShowControls(false)}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={content.file_path}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Video Controls Overlay */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="space-y-2">
                  {/* Progress Bar */}
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm w-12">{formatTime(currentTime)}</span>
                    <div className="flex-1 relative">
                      <Progress 
                        value={progress} 
                        className="h-1 cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const newTime = (clickX / rect.width) * duration;
                          handleSeek(newTime);
                        }}
                      />
                    </div>
                    <span className="text-white text-sm w-12">{formatTime(duration)}</span>
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleSkip(-10)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={handlePlayPause}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        onClick={() => handleSkip(10)}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          onClick={handleMuteToggle}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="bg-black bg-opacity-50 text-white text-sm rounded px-2 py-1"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                      </select>
                      
                      <Button
                        onClick={handleFullscreen}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white hover:bg-opacity-20"
                      >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 relative">
            <img
              src={content.file_path}
              alt={content.title}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            />
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                onClick={() => handleZoom(zoom - 10)}
                variant="outline"
                size="sm"
              >
                -
              </Button>
              <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-sm rounded">
                {zoom}%
              </span>
              <Button
                onClick={() => handleZoom(zoom + 10)}
                variant="outline"
                size="sm"
              >
                +
              </Button>
              <Button
                onClick={handleRotate}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
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

      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500">Content type not supported</p>
          </div>
        );
    }
  };

  const getContentIcon = () => {
    switch (content.content_type) {
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'video': return <VideoIcon className="h-5 w-5" />;
      case 'image': return <ImageIcon className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getContentIcon()}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{content.title}</h1>
              <p className="text-sm text-gray-500 capitalize">{content.content_type} Content</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {content.content_type === 'video' && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                {formatTime(currentTime)} / {formatTime(duration)}
              </Badge>
            )}
            
            <Button
              onClick={onExit}
              variant="outline"
              size="sm"
            >
              Exit
            </Button>
          </div>
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
            {content.content_type === 'video' && (
              <span>Duration: {formatTime(duration)}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}





