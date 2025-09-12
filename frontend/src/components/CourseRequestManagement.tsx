"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  User, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  Mail
} from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';

interface CourseRequest {
  id: number;
  student_id: number;
  course_id: number;
  request_reason: string;
  additional_info?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  review_notes?: string;
  requested_at: string;
  reviewed_at?: string;
  course_title?: string;
  student_name?: string;
  student_email?: string;
}

interface CourseRequestManagementProps {
  courseId?: number; // If provided, only show requests for this course
}

export default function CourseRequestManagement({ courseId }: CourseRequestManagementProps) {
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CourseRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [courseId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const url = courseId 
        ? `${api.baseUrl}/api/course-requests/pending?course_id=${courseId}`
        : `${api.baseUrl}/api/course-requests/pending`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        setError('Failed to load course requests');
      }
    } catch (err) {
      setError('Failed to load course requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: number, status: 'approved' | 'rejected') => {
    try {
      setIsReviewing(true);
      
      const response = await fetch(`${api.baseUrl}/api/course-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          status,
          review_notes: reviewNotes
        })
      });

      if (response.ok) {
        // Reload requests
        await loadRequests();
        setSelectedRequest(null);
        setReviewNotes('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to review request');
      }
    } catch (err) {
      setError('Failed to review request');
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading course requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button onClick={loadRequests} className="mt-2" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Course Requests</h2>
        <Badge variant="outline">
          {requests.length} Pending
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">
              There are currently no pending course requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.course_title}</CardTitle>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-1" />
                  {request.student_name || 'Unknown Student'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Reason:</strong> {request.request_reason}
                  </div>
                  
                  {request.additional_info && (
                    <div className="text-sm">
                      <strong>Additional Info:</strong>
                      <p className="text-gray-600 mt-1">{request.additional_info}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    Requested: {formatDate(request.requested_at)}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Review Course Request
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRequest(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedRequest.course_title}</h4>
                  <p className="text-sm text-gray-600">
                    Requested by: {selectedRequest.student_name} ({selectedRequest.student_email})
                  </p>
                </div>
                
                <div>
                  <Label>Request Reason</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.request_reason}</p>
                </div>
                
                {selectedRequest.additional_info && (
                  <div>
                    <Label>Additional Information</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedRequest.additional_info}</p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="review_notes">Review Notes</Label>
                  <Textarea
                    id="review_notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleReview(selectedRequest.id, 'rejected')}
                    variant="destructive"
                    disabled={isReviewing}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedRequest.id, 'approved')}
                    disabled={isReviewing}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}



