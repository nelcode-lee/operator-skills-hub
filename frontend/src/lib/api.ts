/**
 * API Configuration and utilities
 */

// Use Vercel backend URL for production, relative for development
const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://operator-skills-hub-backend.vercel.app' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

// Debug logging
console.log('API_BASE_URL:', API_BASE_URL);
console.log('NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);

export const api = {
  baseUrl: API_BASE_URL,
  
  // Token validation
  isTokenValid: () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },
  
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
    logout: `${API_BASE_URL}/api/auth/logout`,
  },
  
  // User profile endpoints
  userProfiles: {
    register: `${API_BASE_URL}/api/user-profiles/register`,
    me: `${API_BASE_URL}/api/user-profiles/me`,
    updateProfile: `${API_BASE_URL}/api/user-profiles/profile`,
    createProfile: `${API_BASE_URL}/api/user-profiles/profile`,
  },
  
  // User management endpoints (admin only)
  users: {
    list: `${API_BASE_URL}/api/users/`,
    get: (userId: number) => `${API_BASE_URL}/api/users/${userId}`,
    update: (userId: number) => `${API_BASE_URL}/api/users/${userId}`,
    delete: (userId: number) => `${API_BASE_URL}/api/users/${userId}`,
  },
  
  // Course endpoints
  courses: {
    list: `${API_BASE_URL}/api/courses/`,
    uploadPdf: `${API_BASE_URL}/api/instructor-ai/upload-document`,
    getContent: (courseId: number) => `${API_BASE_URL}/api/course-management/${courseId}/content`,
    viewContent: (courseId: number, contentId: number) => 
      `${API_BASE_URL}/api/course-management/${courseId}/content/${contentId}/view`,
    pdfViewer: (courseId: number, contentId: number, token?: string) => 
      token ? `${API_BASE_URL}/api/courses/${courseId}/content/${contentId}/pdf-viewer?token=${token}` :
      `${API_BASE_URL}/api/courses/${courseId}/content/${contentId}/pdf-viewer`,
    pdfDownload: (courseId: number, contentId: number, token?: string) => 
      token ? `${API_BASE_URL}/api/courses/${courseId}/content/${contentId}/download?token=${token}` :
      `${API_BASE_URL}/api/courses/${courseId}/content/${contentId}/download`,
    grantAccess: (courseId: number) => `${API_BASE_URL}/api/course-management/${courseId}/grant-access`,
    revokeAccess: (courseId: number) => `${API_BASE_URL}/api/course-management/${courseId}/revoke-access`,
    getStudents: (courseId: number) => `${API_BASE_URL}/api/course-management/${courseId}/students`,
    endSession: (courseId: number, contentId: number) => 
      `${API_BASE_URL}/api/course-management/${courseId}/content/${contentId}/end-session`,
    getAnalytics: (courseId: number) => `${API_BASE_URL}/api/course-management/${courseId}/learning-analytics`,
    createTest: (courseId: number, contentId: number) => 
      `${API_BASE_URL}/api/course-management/${courseId}/content/${contentId}/create-test`,
    startTest: (courseId: number, assessmentId: number) => 
      `${API_BASE_URL}/api/courses/${courseId}/tests/${assessmentId}/start`,
    submitTest: (courseId: number, assessmentId: number) => 
      `${API_BASE_URL}/api/courses/${courseId}/tests/${assessmentId}/submit`,
    getTestResults: (courseId: number) => `${API_BASE_URL}/api/courses/${courseId}/test-results`,
  },

  // Learning endpoints (for students)
  learning: {
    myCourses: `${API_BASE_URL}/api/learning/my-courses`,
    mySessions: `${API_BASE_URL}/api/learning/my-sessions`,
    getModules: (courseId: number) => `${API_BASE_URL}/api/learning/courses/${courseId}/modules`,
    getContent: (courseId: number) => `${API_BASE_URL}/api/learning/courses/${courseId}/content`,
    viewContent: (courseId: number, contentId: number) => 
      `${API_BASE_URL}/api/learning/courses/${courseId}/content/${contentId}/view`,
    pdfViewer: (courseId: number, contentId: number, token?: string) => 
      token ? `${API_BASE_URL}/api/courses/${courseId}/content/${contentId}/pdf-viewer?token=${token}` :
      `${API_BASE_URL}/api/courses/${courseId}/content/${contentId}/pdf-viewer`,
  },

  // Web content endpoints (for converted PDF content)
  webContent: {
    getContent: (courseId: number) => `${API_BASE_URL}/api/courses/${courseId}/web-content`,
    getSection: (courseId: number, sectionId: number) => 
      `${API_BASE_URL}/api/courses/${courseId}/web-content/sections/${sectionId}`,
  },

  // Instructor AI endpoints
  instructorAI: {
    uploadDocument: `${API_BASE_URL}/api/instructor-ai/upload-document`,
    generateContent: `${API_BASE_URL}/api/instructor-ai/generate-content`,
    getContentGenerations: (courseId?: number) => 
      courseId ? `${API_BASE_URL}/api/instructor-ai/content-generations?course_id=${courseId}` : 
      `${API_BASE_URL}/api/instructor-ai/content-generations`,
    approveContent: (generationId: number) => 
      `${API_BASE_URL}/api/instructor-ai/approve-content/${generationId}`,
    rejectContent: (generationId: number) => 
      `${API_BASE_URL}/api/instructor-ai/reject-content/${generationId}`,
    searchContent: (courseId: number, query: string, topK: number = 5) => 
      `${API_BASE_URL}/api/instructor-ai/search-content?course_id=${courseId}&query=${encodeURIComponent(query)}&top_k=${topK}`,
    getCourseDocuments: (courseId: number) => 
      `${API_BASE_URL}/api/instructor-ai/course-documents?course_id=${courseId}`,
  },

  // Messaging and Q&A endpoints
  messaging: {
    // Messages
    messages: `${API_BASE_URL}/api/messaging/messages`,
    recipients: `${API_BASE_URL}/api/messaging/recipients`,
    getMessage: (messageId: number) => `${API_BASE_URL}/api/messaging/messages/${messageId}`,
    updateMessage: (messageId: number) => `${API_BASE_URL}/api/messaging/messages/${messageId}`,
    deleteMessage: (messageId: number) => `${API_BASE_URL}/api/messaging/messages/${messageId}`,
    
    // Q&A Posts
    qaPosts: `${API_BASE_URL}/api/messaging/qa/posts`,
    getQAPost: (postId: number) => `${API_BASE_URL}/api/messaging/qa/posts/${postId}`,
    updateQAPost: (postId: number) => `${API_BASE_URL}/api/messaging/qa/posts/${postId}`,
    deleteQAPost: (postId: number) => `${API_BASE_URL}/api/messaging/qa/posts/${postId}`,
    
    // Votes
    votes: `${API_BASE_URL}/api/messaging/qa/votes`,
    deleteVote: (postId: number) => `${API_BASE_URL}/api/messaging/qa/votes/${postId}`,
    
    // Notifications
    notifications: `${API_BASE_URL}/api/messaging/notifications`,
    notificationsStream: `${API_BASE_URL}/api/messaging/notifications/stream`,
    notificationPreferences: `${API_BASE_URL}/api/messaging/notifications/preferences`,
    updateNotification: (notificationId: number) => `${API_BASE_URL}/api/messaging/notifications/${notificationId}`,
    deleteNotification: (notificationId: number) => `${API_BASE_URL}/api/messaging/notifications/${notificationId}`,
    
    // Dashboard
    summary: `${API_BASE_URL}/api/messaging/dashboard/summary`,
    qaSummary: `${API_BASE_URL}/api/messaging/qa/summary`,
  },

  // Analytics and Reporting
  analytics: {
    overview: `${API_BASE_URL}/api/analytics/overview`,
    courses: `${API_BASE_URL}/api/analytics/courses`,
    userEngagement: `${API_BASE_URL}/api/analytics/users/engagement`,
    timeSeries: `${API_BASE_URL}/api/analytics/timeseries`,
    export: `${API_BASE_URL}/api/analytics/export`,
    templates: `${API_BASE_URL}/api/analytics/templates`,
    savedReports: `${API_BASE_URL}/api/analytics/reports/saved`,
    saveReport: `${API_BASE_URL}/api/analytics/reports/save`,
  },

  // Time Tracking endpoints
  timeTracking: {
    start: `${API_BASE_URL}/api/time-tracking/start`,
    update: (sessionId: string) => `${API_BASE_URL}/api/time-tracking/update/${sessionId}`,
    end: (sessionId: string) => `${API_BASE_URL}/api/time-tracking/end/${sessionId}`,
    active: `${API_BASE_URL}/api/time-tracking/active`,
    courseSummary: (courseId: number) => `${API_BASE_URL}/api/time-tracking/course/${courseId}/summary`,
  },
};

/**
 * Check if token is valid and not expired
 */
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

/**
 * Get authorization headers for API requests with token validation
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  
  if (!token || !api.isTokenValid()) {
    // Redirect to login if token is invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Get authorization headers for form data requests with token validation
 */
export const getAuthHeadersForm = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  
  if (!token || !api.isTokenValid()) {
    // Redirect to login if token is invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Handle API response errors with 401 handling
 */
export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
    
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Make authenticated API request with automatic error handling
 */
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  
  if (Object.keys(headers).length === 0) {
    throw new Error('No valid authentication token');
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  return handleApiError(response);
};

/**
 * Logout function - clears token and redirects to main site
 */
export const logout = () => {
  // Clear the token from localStorage
  localStorage.removeItem('token');
  
  // Redirect to main site (home page)
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};
