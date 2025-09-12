'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface TimeTrackerProps {
  courseId: number;
  moduleId?: number;
  contentId?: number;
  onTimeUpdate?: (seconds: number) => void;
}

interface TimeTrackingData {
  id: number;
  session_id: string;
  course_id: number;
  module_id?: number;
  content_id?: number;
  time_spent_seconds: number;
  is_active: boolean;
  started_at: string;
  last_activity: string;
  ended_at?: string;
}

export default function TimeTracker({ 
  courseId, 
  moduleId, 
  contentId, 
  onTimeUpdate 
}: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Start time tracking
  const startTracking = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(api.timeTracking.start, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: courseId,
          module_id: moduleId,
          content_id: contentId,
          metadata: {
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start time tracking');
      }

      const data: TimeTrackingData = await response.json();
      setSessionId(data.session_id);
      setTimeSpent(data.time_spent_seconds);
      setIsTracking(true);
      startTimeRef.current = Date.now();
      
      // Start local timer
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTime = data.time_spent_seconds + elapsed;
        setTimeSpent(newTime);
        onTimeUpdate?.(newTime);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // Pause time tracking
  const pauseTracking = async () => {
    if (!sessionId || !isTracking) return;
    
    try {
      setIsLoading(true);
      
      // Update server with current time
      await fetch(api.timeTracking.update(sessionId), {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_spent_seconds: timeSpent,
          module_id: moduleId,
          content_id: contentId,
        }),
      });
      
      // Stop local timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsTracking(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // Resume time tracking
  const resumeTracking = () => {
    if (!sessionId) return;
    
    setIsTracking(true);
    startTimeRef.current = Date.now();
    
    // Resume local timer
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newTime = timeSpent + elapsed;
      setTimeSpent(newTime);
      onTimeUpdate?.(newTime);
    }, 1000);
  };

  // Stop time tracking
  const stopTracking = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      
      // Stop local timer first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Update server with final time
      await fetch(api.timeTracking.end(sessionId), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          final_time_spent_seconds: timeSpent,
          metadata: {
            ended_at: new Date().toISOString(),
          }
        }),
      });
      
      setIsTracking(false);
      setSessionId(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop tracking');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-save every 30 seconds when tracking
  useEffect(() => {
    if (!isTracking || !sessionId) return;
    
    const saveInterval = setInterval(async () => {
      try {
        await fetch(api.timeTracking.update(sessionId), {
          method: 'PUT',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            time_spent_seconds: timeSpent,
            module_id: moduleId,
            content_id: contentId,
          }),
        });
      } catch (err) {
        console.error('Failed to auto-save time tracking:', err);
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [isTracking, sessionId, timeSpent, moduleId, contentId]);

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Time Spent:</span>
          </div>
          <div className="text-lg font-mono font-semibold text-gray-900">
            {formatTime(timeSpent)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isTracking ? (
            <button
              onClick={startTracking}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
            >
              <Play className="h-4 w-4" />
              {isLoading ? 'Starting...' : 'Start'}
            </button>
          ) : (
            <>
              <button
                onClick={pauseTracking}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <Pause className="h-4 w-4" />
                {isLoading ? 'Pausing...' : 'Pause'}
              </button>
              <button
                onClick={resumeTracking}
                disabled={isLoading || isTracking}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
              <button
                onClick={stopTracking}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                <Square className="h-4 w-4" />
                {isLoading ? 'Stopping...' : 'Stop'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {isTracking && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Time tracking active</span>
        </div>
      )}
    </div>
  );
}
