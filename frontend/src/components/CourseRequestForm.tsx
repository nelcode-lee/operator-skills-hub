"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { BookOpen, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface CourseRequestFormProps {
  courseId: number;
  courseTitle: string;
  onRequestSubmitted?: () => void;
  onClose?: () => void;
}

interface CourseRequestData {
  course_id: number;
  request_reason: string;
  additional_info?: string;
}

export default function CourseRequestForm({ 
  courseId, 
  courseTitle, 
  onRequestSubmitted, 
  onClose 
}: CourseRequestFormProps) {
  const [formData, setFormData] = useState<CourseRequestData>({
    course_id: courseId,
    request_reason: '',
    additional_info: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${api.baseUrl}/api/course-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        if (onRequestSubmitted) {
          onRequestSubmitted();
        }
        // Reset form
        setFormData({
          course_id: courseId,
          request_reason: '',
          additional_info: ''
        });
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || 'Failed to submit request');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting course request:', error);
      setErrorMessage('Network error. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CourseRequestData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (submitStatus === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Request Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              Your request for <strong>{courseTitle}</strong> has been submitted. 
              An instructor or admin will review your request and notify you of the decision.
            </p>
            <div className="space-x-2">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Request Course Access
        </CardTitle>
        <p className="text-sm text-gray-600">
          Request access to <strong>{courseTitle}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {errorMessage}
            </div>
          )}

          <div>
            <Label htmlFor="request_reason">Why do you want to take this course? *</Label>
            <Select 
              value={formData.request_reason} 
              onValueChange={(value) => handleInputChange('request_reason', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="career_development">Career Development</SelectItem>
                <SelectItem value="skill_enhancement">Skill Enhancement</SelectItem>
                <SelectItem value="job_requirement">Job Requirement</SelectItem>
                <SelectItem value="personal_interest">Personal Interest</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="additional_info">Additional Information (Optional)</Label>
            <Textarea
              id="additional_info"
              value={formData.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              placeholder="Please provide any additional information that might help with your request..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.request_reason}
              className="flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}



