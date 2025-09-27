import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { AdminAuthService } from '../services/admin-auth.service';
import {
  AuthState,
  LoginCredentials,
  AdminRegistrationData,
  RegistrationResponse,
  OtpVerificationData
} from '../types/auth.types';
import { LOGIN_ROUTE } from '../config/constants';

// Admin Auth context interface
interface AdminAuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: AdminRegistrationData) => Promise<RegistrationResponse>;
  verifyOtp: (data: OtpVerificationData) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  userType: 'admin';
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: any }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Create context
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Provider component
export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 AdminAuth - Checking authentication status');
      dispatch({ type: 'SET_LOADING', payload: true });

      // First check local storage for authentication data
      const storedUser = AdminAuthService.getStoredUser();
      const hasToken = AdminAuthService.isAuthenticated();

      // console.log('🔍 AdminAuth - Local auth data:', {
      //   hasUser: !!storedUser,
      //   hasToken: !!hasToken,
      //   userRole: storedUser?.role,
      //   userEmail: storedUser?.email
      // });

      // If we have local data and it's an admin user, authenticate immediately
      if (storedUser && hasToken && storedUser.role === 'admin') {
        console.log('✅ AdminAuth - Admin user authenticated from local storage:', storedUser.email);
        dispatch({ type: 'AUTH_SUCCESS', payload: storedUser });
        return;
      }

      // If no local data or wrong role, logout
      console.log('❌ AdminAuth - No admin user found in local storage or wrong role');
      dispatch({ type: 'AUTH_LOGOUT' });

    } catch (error: any) {
      console.error('❌ AdminAuth - Auth check failed:', error.message);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Use AdminAuthService for login
      const response = await AdminAuthService.login(credentials);
      
      // Verify the user is actually an admin
      if (response.data.user.role !== 'admin') {
        throw new Error('Access denied: Admin privileges required');
      }

      console.log('✅ AdminAuth - Admin login successful:', response.data.user.email);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
    } catch (error: any) {
      const errorMessage = error.message || 'Admin login failed. Please try again.';
      console.error('❌ AdminAuth - Login failed:', errorMessage);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 AdminAuth - Starting admin logout process');
      await AdminAuthService.logout();
      console.log('✅ AdminAuth - Server logout successful');
    } catch (error) {
      console.error('❌ AdminAuth - Logout error:', error);
    } finally {
      console.log('🧹 AdminAuth - Clearing admin state');
      dispatch({ type: 'AUTH_LOGOUT' });

      // Redirect to unified login
      window.location.href = LOGIN_ROUTE;
    }
  };

  // Register function
  const register = async (data: AdminRegistrationData): Promise<RegistrationResponse> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await AdminAuthService.registerAdmin(data);
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Admin registration failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Verify OTP function
  const verifyOtp = async (data: OtpVerificationData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      await AdminAuthService.verifyOtp(data);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      const errorMessage = error.message || 'OTP verification failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Resend OTP function
  const resendOtp = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      await AdminAuthService.resendOtp(email);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend OTP. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Setup response interceptor for handling unauthorized requests - DISABLED
  useEffect(() => {
    console.log('🔧 AdminAuth - Response interceptor DISABLED to prevent automatic logouts');
    // setupResponseInterceptor(() => {
    //   console.log('🚨 AdminAuth - Unauthorized request detected, logging out admin');
    //   dispatch({ type: 'AUTH_LOGOUT' });
    // });
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    console.log('🚀 AdminAuth - Component mounted, checking admin auth status');
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Context value
  const value: AdminAuthContextType = {
    ...state,
    login,
    logout,
    register,
    verifyOtp,
    resendOtp,
    clearError,
    checkAuthStatus,
    userType: 'admin',
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Hook to use admin auth context
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
