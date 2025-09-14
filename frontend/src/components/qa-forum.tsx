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
  Plus, 
  Search, 
  Filter, 
  Star, 
  StarOff, 
  Pin, 
  PinOff, 
  CheckCircle, 
  Clock, 
  Users, 
  Eye,
  Tag,
  Reply,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface QAPost {
  id: number;
  course_id: number;
  author_id: number;
  title: string;
  content: string;
  post_type: 'question' | 'answer' | 'announcement';
  parent_post_id?: number;
  is_pinned: boolean;
  is_resolved: boolean;
  is_archived: boolean;
  tags?: string[];
  view_count: number;
  created_at: string;
  updated_at?: string;
  author_name: string;
  course_title: string;
  reply_count: number;
  vote_score: number;
  user_vote?: 'up' | 'down';
  replies?: QAPost[];
}

interface QASummary {
  total_questions: number;
  unanswered_questions: number;
  recent_posts: QAPost[];
  popular_tags: Array<{ tag: string; count: number }>;
}

interface QAForumProps {
  courseId: number;
  userRole: 'student' | 'instructor' | 'admin';
  currentUserId: number;
}

export default function QAForum({ courseId, userRole, currentUserId }: QAForumProps) {
  const [posts, setPosts] = useState<QAPost[]>([]);
  const [summary, setSummary] = useState<QASummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<QAPost | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Create post state
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    post_type: 'question' as 'question' | 'answer' | 'announcement',
    tags: [] as string[],
    parent_post_id: undefined as number | undefined
  });

  // Reply state
  const [replyData, setReplyData] = useState({
    content: '',
    parent_post_id: 0
  });

  useEffect(() => {
    loadPosts();
    loadSummary();
  }, [courseId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/messaging/qa/posts?course_id=${courseId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error loading Q&A posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/messaging/qa/summary?course_id=${courseId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error loading Q&A summary:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${api.baseUrl}/api/messaging/qa/posts`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...postData,
          course_id: courseId
        })
      });

      if (response.ok) {
        setShowCreatePost(false);
        setPostData({
          title: '',
          content: '',
          post_type: 'question',
          tags: [],
          parent_post_id: undefined
        });
        loadPosts();
        loadSummary();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${api.baseUrl}/api/messaging/qa/posts`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          course_id: courseId,
          title: `Re: ${selectedPost?.title}`,
          content: replyData.content,
          post_type: 'answer',
          parent_post_id: replyData.parent_post_id
        })
      });

      if (response.ok) {
        setReplyData({ content: '', parent_post_id: 0 });
        loadPosts();
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handleVote = async (postId: number, voteType: 'up' | 'down') => {
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
        loadPosts();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleTogglePin = async (postId: number) => {
    if (userRole !== 'instructor' && userRole !== 'admin') return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const response = await fetch(`${api.baseUrl}/api/messaging/qa/posts/${postId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_pinned: !post.is_pinned
        })
      });

      if (response.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleToggleResolve = async (postId: number) => {
    if (userRole !== 'instructor' && userRole !== 'admin') return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const response = await fetch(`${api.baseUrl}/api/messaging/qa/posts/${postId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_resolved: !post.is_resolved
        })
      });

      if (response.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error('Error toggling resolve:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || post.post_type === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'unresolved' && !post.is_resolved) ||
      (filterStatus === 'resolved' && post.is_resolved) ||
      (filterStatus === 'pinned' && post.is_pinned);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'most_voted':
        return b.vote_score - a.vote_score;
      case 'most_replied':
        return b.reply_count - a.reply_count;
      case 'most_viewed':
        return b.view_count - a.view_count;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Q&A forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.total_questions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Unanswered</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.unanswered_questions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.total_questions - summary.unanswered_questions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Popular Tags</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.popular_tags.length}</p>
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
                  placeholder="Search questions and answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="question">Questions</SelectItem>
                <SelectItem value="answer">Answers</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="pinned">Pinned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="most_voted">Most Voted</SelectItem>
                <SelectItem value="most_replied">Most Replies</SelectItem>
                <SelectItem value="most_viewed">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Popular Tags */}
      {summary && summary.popular_tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.popular_tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                  {tag.tag} ({tag.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Course Discussion</h3>
          <Button onClick={() => setShowCreatePost(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Ask Question</span>
          </Button>
        </div>

        {sortedPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">Be the first to start a discussion in this course!</p>
              <Button onClick={() => setShowCreatePost(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ask First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Voting Section */}
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, 'up')}
                      className={`p-1 ${post.user_vote === 'up' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{post.vote_score}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(post.id, 'down')}
                      className={`p-1 ${post.user_vote === 'down' ? 'text-red-600' : 'text-gray-400'}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium truncate">{post.title}</h4>
                      {post.is_pinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {post.is_resolved && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {post.post_type}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content}</p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                      <span>By: {post.author_name}</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.view_count} views</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Reply className="h-3 w-3" />
                        <span>{post.reply_count} replies</span>
                      </span>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          setReplyData({ content: '', parent_post_id: post.id });
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      
                      {(userRole === 'instructor' || userRole === 'admin') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePin(post.id)}
                          >
                            {post.is_pinned ? (
                              <PinOff className="h-3 w-3 mr-1" />
                            ) : (
                              <Pin className="h-3 w-3 mr-1" />
                            )}
                            {post.is_pinned ? 'Unpin' : 'Pin'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleResolve(post.id)}
                          >
                            {post.is_resolved ? (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {post.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Post Type</label>
                  <Select 
                    value={postData.post_type} 
                    onValueChange={(value: 'question' | 'answer' | 'announcement') => 
                      setPostData({...postData, post_type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="answer">Answer</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    placeholder="Enter post title"
                    value={postData.title}
                    onChange={(e) => setPostData({...postData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    placeholder="Enter your post content"
                    value={postData.content}
                    onChange={(e) => setPostData({...postData, content: e.target.value})}
                    rows={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <Input
                    placeholder="Enter tags separated by commas"
                    value={postData.tags.join(', ')}
                    onChange={(e) => setPostData({
                      ...postData, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Post</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reply Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Reply to: {selectedPost.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Reply</label>
                  <Textarea
                    placeholder="Enter your reply"
                    value={replyData.content}
                    onChange={(e) => setReplyData({...replyData, content: e.target.value})}
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedPost(null);
                      setReplyData({ content: '', parent_post_id: 0 });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Post Reply</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}






