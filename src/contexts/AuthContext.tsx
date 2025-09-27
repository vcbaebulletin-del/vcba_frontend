import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { AuthService, setupResponseInterceptor } from '../services';
import { User, LoginCredentials, AdminRegistrationData, OtpVerificationData, RegistrationResponse } from '../types';
import { LOGIN_ROUTE } from '../config/constants';

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Auth context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: AdminRegistrationData) => Promise<RegistrationResponse>;
  verifyOtp: (data: OtpVerificationData) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  userType: 'admin' | 'student'; // Add user type to context
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
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
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status
  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      console.log('🔍 AuthContext - Starting auth check');
      dispatch({ type: 'SET_LOADING', payload: true });

      // Quick check for local authentication data first
      const user = AuthService.getStoredUser();
      const token = AuthService.isAuthenticated();

      console.log('🔍 AuthContext - Local auth data:', {
        hasUser: !!user,
        hasToken: !!token,
        userRole: user?.role,
        userEmail: user?.email
      });

      if (!user || !token) {
        // No local auth data, definitely not authenticated
        console.log('❌ AuthContext - No local auth data, logging out');
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // We have local data, set user immediately for better UX
      console.log('✅ AuthContext - Setting user from local data');
      dispatch({ type: 'AUTH_SUCCESS', payload: user });

      // DISABLED SERVER VALIDATION - No more automatic logouts
      console.log('🔍 AuthContext - Server validation DISABLED to prevent logouts');
    } catch (error) {
      console.error('❌ AuthContext - Auth check failed:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('🔍 AuthContext - Auth check completed');
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await AuthService.login(credentials);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext - Starting logout process');

      await AuthService.logout();
      console.log('✅ AuthContext - Server logout successful');
    } catch (error) {
      console.error('❌ AuthContext - Logout error:', error);
    } finally {
      console.log('🧹 AuthContext - Clearing local state and redirecting');

      const currentUserRole = state.user?.role;
      dispatch({ type: 'AUTH_LOGOUT' });

      // Force redirect to unified login page
      console.log(`🔄 AuthContext - Redirecting to ${LOGIN_ROUTE} for ${currentUserRole || 'unknown'} user`);
      window.location.href = LOGIN_ROUTE;
    }
  };

  // Register admin function
  const register = async (data: AdminRegistrationData): Promise<RegistrationResponse> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const result = await AuthService.registerAdmin(data);

      // Clear loading state and error on successful registration
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'CLEAR_ERROR' });

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Verify OTP function
  const verifyOtp = async (data: OtpVerificationData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      await AuthService.verifyOtp(data);
      
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
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await AuthService.resendOtp(email);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend OTP. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Setup response interceptor for handling unauthorized requests
  useEffect(() => {
    console.log('🔧 AuthContext - Setting up response interceptor');
    setupResponseInterceptor(() => {
      console.log('🚨 AuthContext - Unauthorized request detected, logging out');
      dispatch({ type: 'AUTH_LOGOUT' });
    });
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    console.log('🚀 AuthContext - Component mounted, checking auth status');
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Context value
  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    verifyOtp,
    resendOtp,
    clearError,
    checkAuthStatus,
    userType: 'admin', // Default to admin for legacy compatibility
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
