"use client";

import { useEffect, useState, useCallback } from 'react';
import { api, getAuthHeaders } from '@/lib/api';

interface Notification {
  id: number;
  title: string;
  content: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  course_id?: number;
}

interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  clearNotifications: () => void;
}

export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(api.messaging.updateNotification(notificationId), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_read: true })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      const headers = getAuthHeaders();
      const token = headers.Authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('No auth token available for real-time notifications');
        return;
      }

      eventSource = new EventSource(`${api.messaging.notificationsStream}?token=${token}`);

      eventSource.onopen = () => {
        console.log('Real-time notifications connected');
        setIsConnected(true);
      };

      eventSource.onclose = () => {
        console.log('Real-time notifications connection closed');
        setIsConnected(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('Real-time notifications enabled');
          } else if (data.type === 'heartbeat') {
            // Keep connection alive
            return;
          } else if (data.id) {
            // New notification
            setNotifications(prev => [data, ...prev]);
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
              new Notification(data.title, {
                body: data.content,
                icon: '/favicon.ico'
              });
            }
          }
        } catch (error) {
          console.error('Error parsing notification data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Real-time notifications error:', error);
        setIsConnected(false);
        
        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
          console.log('Attempting to reconnect to real-time notifications...');
          connect();
        }, 5000);
      };
    };

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearNotifications
  };
}
