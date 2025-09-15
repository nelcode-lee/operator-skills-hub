"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentNavigation from '@/components/student-navigation';
import { api } from '@/lib/api';

interface User {
  name: string;
  email: string;
  role: string;
}

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Check if token is valid
      if (!api.isTokenValid()) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      // Get user info
      const response = await fetch(`${api.baseUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'student') {
          // Redirect to appropriate portal based on role
          if (userData.role === 'instructor') {
            router.push('/instructors');
          } else {
            router.push('/admin');
          }
          return;
        }
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavigation user={user} onLogout={handleLogout} />
      <main className="lg:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}











