"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CoursesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect students to the proper student catalog
    router.replace('/student-catalog');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to course catalog...</p>
      </div>
    </div>
  );
}
