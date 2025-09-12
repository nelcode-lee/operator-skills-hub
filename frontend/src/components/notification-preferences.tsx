"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Wifi, 
  MessageSquare, 
  BookOpen, 
  AlertCircle, 
  BarChart3,
  Settings
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface NotificationPreferences {
  email_notifications: boolean;
  realtime_notifications: boolean;
  preferences: {
    messages: boolean;
    qa_replies: boolean;
    course_updates: boolean;
    test_results: boolean;
    system: boolean;
  };
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    realtime_notifications: true,
    preferences: {
      messages: true,
      qa_replies: true,
      course_updates: true,
      test_results: true,
      system: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch(api.messaging.notificationPreferences, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch(api.messaging.notificationPreferences, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        // Show success message
        console.log('Notification preferences saved successfully');
      } else {
        console.error('Failed to save notification preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSpecificPreference = (key: keyof NotificationPreferences['preferences'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading preferences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Global Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="realtime-notifications" className="text-base font-medium">
                    Real-time Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receive instant browser notifications
                  </p>
                </div>
              </div>
              <Switch
                id="realtime-notifications"
                checked={preferences.realtime_notifications}
                onCheckedChange={(checked) => updatePreference('realtime_notifications', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Specific Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label htmlFor="messages" className="text-base font-medium">
                      Messages
                    </Label>
                    <p className="text-sm text-gray-600">
                      New messages from instructors and students
                    </p>
                  </div>
                </div>
                <Switch
                  id="messages"
                  checked={preferences.preferences.messages}
                  onCheckedChange={(checked) => updateSpecificPreference('messages', checked)}
                  disabled={!preferences.email_notifications && !preferences.realtime_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <div>
                    <Label htmlFor="qa-replies" className="text-base font-medium">
                      Q&A Replies
                    </Label>
                    <p className="text-sm text-gray-600">
                      Replies to your questions in course discussions
                    </p>
                  </div>
                </div>
                <Switch
                  id="qa-replies"
                  checked={preferences.preferences.qa_replies}
                  onCheckedChange={(checked) => updateSpecificPreference('qa_replies', checked)}
                  disabled={!preferences.email_notifications && !preferences.realtime_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <Label htmlFor="course-updates" className="text-base font-medium">
                      Course Updates
                    </Label>
                    <p className="text-sm text-gray-600">
                      New content, announcements, and course changes
                    </p>
                  </div>
                </div>
                <Switch
                  id="course-updates"
                  checked={preferences.preferences.course_updates}
                  onCheckedChange={(checked) => updateSpecificPreference('course_updates', checked)}
                  disabled={!preferences.email_notifications && !preferences.realtime_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label htmlFor="test-results" className="text-base font-medium">
                      Test Results
                    </Label>
                    <p className="text-sm text-gray-600">
                      Assessment scores and learning progress updates
                    </p>
                  </div>
                </div>
                <Switch
                  id="test-results"
                  checked={preferences.preferences.test_results}
                  onCheckedChange={(checked) => updateSpecificPreference('test_results', checked)}
                  disabled={!preferences.email_notifications && !preferences.realtime_notifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div>
                    <Label htmlFor="system" className="text-base font-medium">
                      System Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Platform updates and maintenance notices
                    </p>
                  </div>
                </div>
                <Switch
                  id="system"
                  checked={preferences.preferences.system}
                  onCheckedChange={(checked) => updateSpecificPreference('system', checked)}
                  disabled={!preferences.email_notifications && !preferences.realtime_notifications}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="min-w-24"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


