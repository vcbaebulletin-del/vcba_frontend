import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { StudentAuthService } from '../services/student-auth.service';
import {
  AuthState,
  LoginCredentials
} from '../types/auth.types';
import { LOGIN_ROUTE } from '../config/constants';

// Student Auth context interface
interface StudentAuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  userType: 'student';
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
const StudentAuthContext = createContext<StudentAuthContextType | undefined>(undefined);

// Provider component
export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('🔍 StudentAuth - Checking authentication status');
      dispatch({ type: 'SET_LOADING', payload: true });

      // First check local storage for authentication data
      const storedUser = StudentAuthService.getStoredUser();
      const hasToken = StudentAuthService.isAuthenticated();

      console.log('🔍 StudentAuth - Local auth data:', {
        hasUser: !!storedUser,
        hasToken: !!hasToken,
        userRole: storedUser?.role,
        userEmail: storedUser?.email
      });

      // If we have local data and it's a student user, authenticate immediately
      if (storedUser && hasToken && storedUser.role === 'student') {
        console.log('✅ StudentAuth - Student user authenticated from local storage:', storedUser.email);
        dispatch({ type: 'AUTH_SUCCESS', payload: storedUser });
        return;
      }

      // If no local data or wrong role, logout
      console.log('❌ StudentAuth - No student user found in local storage or wrong role');
      dispatch({ type: 'AUTH_LOGOUT' });

    } catch (error: any) {
      console.error('❌ StudentAuth - Auth check failed:', error.message);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Use StudentAuthService for login
      const response = await StudentAuthService.login(credentials);
      
      // Verify the user is actually a student
      if (response.data.user.role !== 'student') {
        throw new Error('Access denied: Student account required');
      }

      console.log('✅ StudentAuth - Student login successful:', response.data.user.email);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
    } catch (error: any) {
      const errorMessage = error.message || 'Student login failed. Please try again.';
      console.error('❌ StudentAuth - Login failed:', errorMessage);
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 StudentAuth - Starting student logout process');
      await StudentAuthService.logout();
      console.log('✅ StudentAuth - Server logout successful');
    } catch (error) {
      console.error('❌ StudentAuth - Logout error:', error);
    } finally {
      console.log('🧹 StudentAuth - Clearing student state');
      dispatch({ type: 'AUTH_LOGOUT' });

      // Redirect to unified login
      window.location.href = LOGIN_ROUTE;
    }
  };

  // Setup response interceptor for handling unauthorized requests - DISABLED
  useEffect(() => {
    console.log('🔧 StudentAuth - Response interceptor DISABLED to prevent automatic logouts');
    // setupResponseInterceptor(() => {
    //   console.log('🚨 StudentAuth - Unauthorized request detected, logging out student');
    //   dispatch({ type: 'AUTH_LOGOUT' });
    // });
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    console.log('🚀 StudentAuth - Component mounted, checking student auth status');
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Context value
  const value: StudentAuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    checkAuthStatus,
    userType: 'student',
  };

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
};

// Hook to use student auth context
export const useStudentAuth = (): StudentAuthContextType => {
  const context = useContext(StudentAuthContext);
  if (context === undefined) {
    throw new Error('useStudentAuth must be used within a StudentAuthProvider');
  }
  return context;
};

export default StudentAuthContext;
