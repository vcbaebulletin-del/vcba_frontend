// Application constants
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000';

// Utility function to get full image URL
export const getImageUrl = (imagePath?: string | null, bustCache: boolean = false): string | null => {
  if (!imagePath) return null;

  // If already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return bustCache ? `${imagePath}?t=${Date.now()}` : imagePath;
  }

  // Construct full URL with API base
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  let fullUrl = `${API_BASE_URL}${cleanPath}`;

  // Add cache busting parameter if requested
  if (bustCache) {
    fullUrl += `?t=${Date.now()}`;
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🖼️ Image URL constructed:', { imagePath, cleanPath, fullUrl, bustCache });
  }

  return fullUrl;
};

// Authentication constants - Separate keys for admin and student isolation
export const AUTH_TOKEN_KEY = 'vcba_auth_token';
export const USER_DATA_KEY = 'vcba_user_data';
export const REFRESH_TOKEN_KEY = 'vcba_refresh_token';

// Admin-specific authentication keys
export const ADMIN_AUTH_TOKEN_KEY = 'vcba_admin_auth_token';
export const ADMIN_USER_DATA_KEY = 'vcba_admin_user_data';
export const ADMIN_REFRESH_TOKEN_KEY = 'vcba_admin_refresh_token';

// Student-specific authentication keys
export const STUDENT_AUTH_TOKEN_KEY = 'vcba_student_auth_token';
export const STUDENT_USER_DATA_KEY = 'vcba_student_user_data';
export const STUDENT_REFRESH_TOKEN_KEY = 'vcba_student_refresh_token';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/me',
    VALIDATE_TOKEN: '/api/auth/validate-token',
    ADMIN_REGISTER: '/api/auth/admin/register',
    VERIFY_OTP: '/api/auth/admin/verify-otp',
    RESEND_OTP: '/api/auth/admin/resend-otp',
  },
  ADMIN: {
    STUDENTS: '/api/admin/students',
    STUDENT_BY_ID: (id: string) => `/api/admin/students/${id}`,
    RESET_STUDENT_PASSWORD: (id: string) => `/api/admin/students/${id}/reset-password`,
  },
  ANNOUNCEMENTS: {
    BASE: '/api/announcements',
    FEATURED: '/api/announcements/featured',
    BY_ID: (id: string) => `/api/announcements/${id}`,
    PUBLISH: (id: string) => `/api/announcements/${id}/publish`,
    UNPUBLISH: (id: string) => `/api/announcements/${id}/unpublish`,
    VIEW: (id: string) => `/api/announcements/${id}/view`,
    LIKE: (id: string) => `/api/announcements/${id}/like`,
    REACTIONS: (id: string) => `/api/announcements/${id}/reactions`,
    CATEGORIES: '/api/announcements/categories',
    CATEGORIES_WITH_SUBCATEGORIES: '/api/announcements/categories/with-subcategories',
    SUBCATEGORIES: '/api/announcements/subcategories',
    SUBCATEGORIES_BY_CATEGORY: (categoryId: string) => `/api/announcements/categories/${categoryId}/subcategories`,
    REACTION_TYPES: '/api/announcements/reaction-types',
  },
  COMMENTS: {
    BASE: '/api/comments',
    BY_ID: (id: string) => `/api/comments/${id}`,
    LIKE: (id: string) => `/api/comments/${id}/like`,
    FLAG: (id: string) => `/api/comments/${id}/flag`,
    APPROVE: (id: string) => `/api/comments/${id}/approve`,
    REJECT: (id: string) => `/api/comments/${id}/reject`,
    REACTIONS: (id: string) => `/api/comments/${id}/reactions`,
    FLAGGED: '/api/comments/admin/flagged',
  },
  CALENDAR: {
    BASE: '/api/calendar',
    BY_ID: (id: string) => `/api/calendar/${id}`,
    VIEW: '/api/calendar/view',
    CURRENT_MONTH: '/api/calendar/current-month',
    UPCOMING: '/api/calendar/upcoming',

    DATE_RANGE: '/api/calendar/date-range',
    BY_DATE: (date: string) => `/api/calendar/date/${date}`,
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/mark-all-read',
    DELETE: (id: string) => `/api/notifications/${id}`,
  },
  ARCHIVE: {
    STATISTICS: '/api/archive/statistics',
    ANNOUNCEMENTS: '/api/archive/announcements',
    CALENDAR_EVENTS: '/api/archive/calendar-events',
    STUDENTS: '/api/archive/students',
    RESTORE_ANNOUNCEMENT: (id: string) => `/api/archive/announcements/${id}/restore`,
    RESTORE_CALENDAR_EVENT: (id: string) => `/api/archive/calendar-events/${id}/restore`,
    RESTORE_STUDENT: (id: string) => `/api/archive/students/${id}/restore`,
    PERMANENT_DELETE_ANNOUNCEMENT: (id: string) => `/api/archive/announcements/${id}/permanent`,
  },
} as const;

// Form validation constants
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  OTP: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  NAME: {
    MAX_LENGTH: 50,
  },
} as const;

// UI constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login', // Unified login route
  ADMIN: {
    LOGIN: '/admin/login', // Legacy - redirects to unified login
    REGISTER: '/admin/register',
    DASHBOARD: '/admin/announcement-approval',
  },
  STUDENT: {
    LOGIN: '/student/login', // Legacy - redirects to unified login
    NEWSFEED: '/student/newsfeed',
  },
} as const;

// Centralized login route constant
export const LOGIN_ROUTE = '/login';

// Theme constants
export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Your account has been temporarily locked.',
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  OTP_INVALID: 'Invalid OTP. Please check and try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
} as const;
