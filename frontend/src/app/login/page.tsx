"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, User, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { api, handleApiError } from '@/lib/api';

export default function LoginPage() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
    cscs_card_number: '',
    first_name: '',
    last_name: '',
    phone: '',
    qualifications: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection to:', api.baseUrl);
      const response = await fetch(`${api.baseUrl}/health`);
      const data = await response.json();
      console.log('API health check response:', data);
      setError(`API Connection Test: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('API connection test failed:', error);
      setError(`API Connection Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testAuthEndpoint = async () => {
    try {
      console.log('Testing auth endpoint:', api.auth.login);
      console.log('API Base URL:', api.baseUrl);
      
      const formData = new URLSearchParams({
        username: 'admin@example.com',
        password: 'admin123',
      });
      
      console.log('Form data being sent:', loginFormData.toString());
      
      const response = await fetch(api.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginFormData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Auth endpoint test response:', data);
      setError(`Auth Endpoint Test: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Auth endpoint test failed:', error);
      setError(`Auth Endpoint Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called!');
    e.preventDefault();
    console.log('preventDefault called');
    setIsLoading(true);
    setError('');

    try {
      console.log('Login URL:', api.auth.login);
      console.log('API Base URL:', api.baseUrl);
      console.log('Login data:', { email: formData.email, password: '***' });
      console.log('Form data email:', formData.email);
      console.log('Form data password length:', formData.password.length);
      console.log('Form data password first char:', formData.password.charAt(0));
      
      // Use exact same approach as test button
      const loginFormData = new URLSearchParams({
        username: formData.email,
        password: formData.password,
      });
      
      console.log('Form data being sent:', loginFormData.toString());
      
      const response = await fetch(api.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginFormData,
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        
        // Get user role from the response
        const userRole = data.user?.role || formData.role;
        
        if (userRole === 'instructor') {
          window.location.href = '/instructors';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        console.log('Login failed with status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.detail || 'Login failed');
        } catch {
          setError(`Login failed: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate required fields for registration
    if (!formData.first_name || !formData.last_name) {
      setError('First name and last name are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(api.userProfiles.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          cscs_card_number: formData.cscs_card_number || null,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          qualifications: formData.qualifications || null,
        }),
      });

      if (response.ok) {
        // Auto-login after registration
        await handleSubmit(e);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Operator Skills Hub</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError('');
                setFormData({
                  email: '',
                  password: '',
                  role: 'student',
                  cscs_card_number: '',
                  first_name: '',
                  last_name: '',
                  phone: '',
                  qualifications: ''
                });
              }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isRegisterMode ? 'sign in to your account' : 'create a new account'}
            </button>
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isRegisterMode ? 'Create your account' : 'Welcome back'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="auth-form" onSubmit={isRegisterMode ? handleRegister : handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="mt-1 relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pl-10"
                    placeholder="Enter your email"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="role">Account Type</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Registration-specific fields */}
              {isRegisterMode && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        required={isRegisterMode}
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        required={isRegisterMode}
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cscs_card_number">CSCS Card Number</Label>
                    <Input
                      id="cscs_card_number"
                      name="cscs_card_number"
                      type="text"
                      value={formData.cscs_card_number}
                      onChange={(e) => setFormData({...formData, cscs_card_number: e.target.value})}
                      placeholder="Enter your CSCS card number (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter your phone number (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <textarea
                      id="qualifications"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                      placeholder="List your qualifications, certifications, and training (optional)"
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <Button
                  id="submit-btn"
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (isRegisterMode ? 'Creating account...' : 'Signing in...') 
                    : (isRegisterMode ? 'Create Account' : 'Sign in')
                  }
                </Button>
                
                {!isRegisterMode && (
                  <div className="flex space-x-2 mt-2">
                    <Button
                      type="button" 
                      variant="outline" 
                      className="flex-1" 
                      onClick={testApiConnection}
                    >
                      Test API Connection
                    </Button>
                    <Button
                      type="button" 
                      variant="outline" 
                      className="flex-1" 
                      onClick={testAuthEndpoint}
                    >
                      Test Auth Endpoint
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Instructor:</strong> instructor@example.com / password123</p>
              <p><strong>Student:</strong> student@example.com / password123</p>
              <p><strong>Admin:</strong> admin@example.com / password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
