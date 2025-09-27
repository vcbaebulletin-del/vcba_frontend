// Authentication related types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'student';
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  grade_level?: number;
  studentNumber?: string;
  profilePicture?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'admin' | 'student';
}

export interface AdminRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  gradeLevel?: string;
}

export interface OtpVerificationData {
  email: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    expiresIn: number;
    refreshToken?: string; // Optional since it might be in httpOnly cookie
  };
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    otpSent: boolean;
  };
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  data: {
    admin: User;
  };
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    details?: any;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: AdminRegistrationData) => Promise<void>;
  verifyOtp: (data: OtpVerificationData) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
}
