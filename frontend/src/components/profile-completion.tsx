"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, User, Phone, Award, AlertCircle } from 'lucide-react';
import { api, getAuthHeaders } from '@/lib/api';
import { UserProfileUpdate } from '@/types/user';

interface ProfileCompletionProps {
  user: any;
  onComplete: () => void;
  onSkip: () => void;
}

export default function ProfileCompletion({ user, onComplete, onSkip }: ProfileCompletionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState<UserProfileUpdate>({
    first_name: user.profile?.first_name || '',
    last_name: user.profile?.last_name || '',
    phone: user.profile?.phone || '',
    qualifications: user.profile?.qualifications || '',
    bio: user.profile?.bio || ''
  });

  const handleInputChange = (field: keyof UserProfileUpdate, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to save profile data:', profileData);
      
      // First try to update existing profile
      let response = await fetch(api.userProfiles.updateProfile, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      console.log('Update response status:', response.status);

      // If profile doesn't exist (404), create a new one
      if (response.status === 404) {
        console.log('Profile not found, creating new profile...');
        response = await fetch(api.userProfiles.createProfile, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        });
        console.log('Create response status:', response.status);
      }

      if (response.ok) {
        console.log('Profile saved successfully');
        onComplete();
      } else {
        const errorData = await response.json();
        console.error('Profile save error:', errorData);
        setError(errorData.detail || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Profile save exception:', error);
      setError('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const isProfileComplete = profileData.first_name && profileData.last_name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center text-blue-800">
            <User className="h-6 w-6 mr-2" />
            Complete Your Profile
          </CardTitle>
          <p className="text-blue-700 text-sm">
            Help us get to know you better by completing your profile information.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={profileData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="mt-1"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={profileData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="mt-1"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="mt-1 relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10"
                placeholder="Enter your phone number (optional)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="qualifications">Qualifications & Training</Label>
            <div className="mt-1 relative">
              <Award className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="qualifications"
                value={profileData.qualifications}
                onChange={(e) => handleInputChange('qualifications', e.target.value)}
                className="pl-10"
                rows={3}
                placeholder="List your qualifications, certifications, and training (optional)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="Tell us a bit about yourself and your experience (optional)"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Why complete your profile?</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>• Personalised learning recommendations</li>
                  <li>• Better course matching based on your qualifications</li>
                  <li>• Enhanced progress tracking and analytics</li>
                  <li>• Access to instructor communications</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!isProfileComplete || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
