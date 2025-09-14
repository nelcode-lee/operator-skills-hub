"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Plus, 
  Reply, 
  Archive, 
  Trash2, 
  Star, 
  StarOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Bell,
  BellOff
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject: string;
  content: string;
  message_type: string;
  course_id?: number;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  sender_name: string;
  recipient_name: string;
  course_title?: string;
  reply_count: number;
}

interface QAPost {
  id: number;
  course_id: number;
  author_id: number;
  title: string;
  content: string;
  post_type: string;
  is_pinned: boolean;
  is_resolved: boolean;
  view_count: number;
  created_at: string;
  author_name: string;
  course_title: string;
  reply_count: number;
  vote_score: number;
  user_vote?: string;
  tags?: string[];
}

interface Notification {
  id: number;
  title: string;
  content: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  course_title?: string;
}

interface MessagingSummary {
  unread_messages: number;
  unread_notifications: number;
  recent_messages: Message[];
  recent_notifications: Notification[];
}

interface MessagingInterfaceProps {
  userRole: 'student' | 'instructor' | 'admin';
  currentUserId: number;
}

export default function MessagingInterface({ userRole, currentUserId }: MessagingInterfaceProps) {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [qaPosts, setQAPosts] = useState<QAPost[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<MessagingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedPost, setSelectedPost] = useState<QAPost | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);

  // Compose message state
  const [composeData, setComposeData] = useState({
    recipient_id: '',
    subject: '',
    content: '',
    course_id: '',
    message_type: 'direct'
  });

  // Q&A post state
  const [qaData, setQAData] = useState({
    course_id: '',
    title: '',
    content: '',
    post_type: 'question',
    tags: [] as string[]
  });

  useEffect(() => {
    loadData();
    loadCourses();
    loadRecipients();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [messagesRes, qaRes, notificationsRes, summaryRes] = await Promise.all([
        fetch(`${api.baseUrl}/api/messaging/messages`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/messaging/qa/posts`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/messaging/notifications`, {
          headers: getAuthHeaders()
        }),
        fetch(`${api.baseUrl}/api/messaging/dashboard/summary`, {
          headers: getAuthHeaders()
        })
      ]);

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setMessages(messagesData);
      }

      if (qaRes.ok) {
        const qaData = await qaRes.json();
        setQAPosts(qaData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error loading messaging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/courses/`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/messaging/recipients`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const recipientsData = await response.json();
        setRecipients(recipientsData);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare message data with proper types
      const messageData = {
        recipient_id: parseInt(composeData.recipient_id),
        subject: composeData.subject,
        content: composeData.content,
        message_type: composeData.message_type,
        course_id: composeData.course_id === 'none' ? null : parseInt(composeData.course_id),
        attachments: null
      };
      
      const response = await fetch(`${api.baseUrl}/api/messaging/messages`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        setShowCompose(false);
        setComposeData({
          recipient_id: '',
          subject: '',
          content: '',
          course_id: '',
          message_type: 'direct'
        });
        loadData();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateQAPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${api.baseUrl}/api/messaging/qa/posts`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(qaData)
      });

      if (response.ok) {
        setQAData({
          course_id: '',
          title: '',
          content: '',
          post_type: 'question',
          tags: []
        });
        loadData();
      }
    } catch (error) {
      console.error('Error creating Q&A post:', error);
    }
  };

  const handleVote = async (postId: number, voteType: string) => {
    try {
      const response = await fetch(`${api.baseUrl}/api/messaging/qa/votes`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: postId,
          vote_type: voteType
        })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      await fetch(`${api.baseUrl}/api/messaging/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_read: true })
      });
      loadData();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = !searchQuery || 
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || 
      message.course_id?.toString() === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  const filteredQAPosts = qaPosts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'all' || 
      post.course_id.toString() === selectedCourse;
    return matchesSearch && matchesCourse;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messaging...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.unread_messages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Notifications</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.unread_notifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Q&A Posts</p>
                  <p className="text-2xl font-bold text-green-600">{qaPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search messages and posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
            {summary && summary.unread_messages > 0 && (
              <Badge variant="destructive" className="ml-2">
                {summary.unread_messages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="qa" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Q&A Forum</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {summary && summary.unread_notifications > 0 && (
              <Badge variant="destructive" className="ml-2">
                {summary.unread_notifications}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Messages</h3>
            <Button onClick={() => setShowCompose(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Message</span>
            </Button>
          </div>

          <div className="space-y-2">
            {filteredMessages.map((message) => (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-colors ${
                  !message.is_read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.is_read) markAsRead(message.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                        <h4 className="font-medium truncate">{message.subject}</h4>
                        <div className="flex items-center space-x-2">
                          {!message.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                          {message.course_title && (
                            <Badge variant="outline" className="text-xs">
                              {message.course_title}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{message.content}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-xs text-gray-500">
                        <span>From: {message.sender_name}</span>
                        <span>To: {message.recipient_name}</span>
                        <span>{new Date(message.created_at).toLocaleDateString()}</span>
                        {message.reply_count > 0 && (
                          <span className="flex items-center space-x-1">
                            <Reply className="h-3 w-3" />
                            <span>{message.reply_count}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:ml-4">
                      {message.is_archived && (
                        <Archive className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Q&A Tab */}
        <TabsContent value="qa" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Q&A Forum</h3>
            <Button onClick={() => setShowCompose(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Question</span>
            </Button>
          </div>

          <div className="space-y-4">
            {filteredQAPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex flex-row sm:flex-col items-center space-x-4 sm:space-x-0 sm:space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id, 'up')}
                        className={`p-1 ${post.user_vote === 'up' ? 'text-blue-600' : 'text-gray-400'}`}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">{post.vote_score}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVote(post.id, 'down')}
                        className={`p-1 ${post.user_vote === 'down' ? 'text-red-600' : 'text-gray-400'}`}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                        <h4 className="font-medium truncate">{post.title}</h4>
                        <div className="flex flex-wrap gap-1">
                          {post.is_pinned && (
                            <Badge variant="secondary" className="text-xs">Pinned</Badge>
                          )}
                          {post.is_resolved && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Resolved
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {post.post_type}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
                        <span>By: {post.author_name}</span>
                        <span>Course: {post.course_title}</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{post.reply_count} replies</span>
                        </span>
                        <span>{post.view_count} views</span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {notification.notification_type === 'message' && (
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                        )}
                        {notification.notification_type === 'qa_reply' && (
                          <BookOpen className="h-5 w-5 text-green-600" />
                        )}
                        {notification.notification_type === 'course_update' && (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        )}
                        {notification.notification_type === 'system' && (
                          <Bell className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                          {notification.course_title && (
                            <span>Course: {notification.course_title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0 self-start sm:self-auto"></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Compose Message Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Recipient</label>
                  <Select value={composeData.recipient_id} onValueChange={(value) => setComposeData({...composeData, recipient_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.length > 0 ? (
                        recipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id.toString()}>
                            {recipient.email} ({recipient.role})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No recipients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    placeholder="Enter subject"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Course (Optional)</label>
                  <Select value={composeData.course_id} onValueChange={(value) => setComposeData({...composeData, course_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    placeholder="Enter your message"
                    value={composeData.content}
                    onChange={(e) => setComposeData({...composeData, content: e.target.value})}
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCompose(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Send Message</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
