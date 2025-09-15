"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuthHeaders } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const response = await fetch(api.auth.me, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const userData = await response.json();
        const userRole = userData.role;
        
        // Redirect based on user role
        if (userRole === 'student') {
          router.replace('/student-portal');
        } else if (userRole === 'instructor') {
          router.replace('/instructors');
        } else if (userRole === 'admin') {
          router.replace('/admin');
        } else {
          // Unknown role, redirect to home
          router.replace('/');
        }
      } else {
        // Invalid token, redirect to login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}
