import { httpClient, tokenManager } from './api.service';
import { API_ENDPOINTS, USER_DATA_KEY, REFRESH_TOKEN_KEY } from '../config/constants';
import {
  LoginCredentials,
  AdminRegistrationData,
  OtpVerificationData,
  AuthResponse,
  RegistrationResponse,
  OtpVerificationResponse,
  User,
  ApiResponse,
} from '../types';

export class AuthService {
  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = tokenManager.getToken();
      if (!token) {
        return null;
      }

      const response = await httpClient.get<{ user: User }>(
        API_ENDPOINTS.AUTH.PROFILE
      );

      if (response.success && response.data) {
        return response.data.user;
      }

      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Login user (admin or student)
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<{
        user: User;
        accessToken: string;
        expiresIn: number;
        refreshToken?: string;
      }>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.success && response.data) {
        // Transform raw database user data to frontend format
        const rawUser = response.data.user as any;
        const transformedUser: User = {
          id: rawUser.admin_id || rawUser.student_id,
          email: rawUser.email,
          role: rawUser.admin_id ? 'admin' : 'student',
          firstName: rawUser.first_name,
          lastName: rawUser.last_name,
          middleName: rawUser.middle_name,
          suffix: rawUser.suffix,
          phoneNumber: rawUser.phone_number || rawUser.phone,
          department: rawUser.department,
          position: rawUser.position,
          grade_level: rawUser.grade_level,
          studentNumber: rawUser.student_number,
          profilePicture: rawUser.profile_picture,
          isActive: Boolean(rawUser.is_active),
          lastLogin: rawUser.last_login,
          createdAt: rawUser.account_created_at || rawUser.created_at,
          updatedAt: rawUser.account_updated_at || rawUser.updated_at,
        };

        // Store tokens and transformed user data
        tokenManager.setToken(response.data.accessToken);
        // Note: refreshToken is typically stored as httpOnly cookie by the backend
        // Only store in localStorage if explicitly provided in response
        if (response.data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(transformedUser));

        return {
          success: true,
          message: response.message || 'Login successful',
          data: {
            ...response.data,
            user: transformedUser,
          },
        };
      }

      throw new Error(response.error?.message || 'Login failed');
    } catch (error: any) {
      // Handle ApiError from httpClient
      if (error.status && error.data) {
        throw new Error(error.data?.error?.message || error.message || 'Login failed');
      }
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register admin user
   */
  static async registerAdmin(data: AdminRegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await httpClient.post<{
        email: string;
        otpSent: boolean;
      }>(
        API_ENDPOINTS.AUTH.ADMIN_REGISTER,
        data
      );

      // The response already contains the full structure from the backend
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Registration initiated successfully',
          data: response.data,
        };
      }

      throw new Error(response.error?.message || 'Registration failed');
    } catch (error: any) {
      // Handle ApiError from httpClient
      if (error.status && error.data) {
        throw new Error(error.data?.error?.message || error.message || 'Registration failed');
      }
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Verify OTP for admin registration
   */
  static async verifyOtp(data: OtpVerificationData): Promise<OtpVerificationResponse> {
    try {
      const response = await httpClient.post<{
        admin: User;
      }>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        data
      );

      // The response already contains the full structure from the backend
      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'OTP verification successful',
          data: response.data,
        };
      }

      throw new Error(response.error?.message || 'OTP verification failed');
    } catch (error: any) {
      // Handle ApiError from httpClient
      if (error.status && error.data) {
        throw new Error(error.data?.error?.message || error.message || 'OTP verification failed');
      }
      throw new Error(error.message || 'OTP verification failed');
    }
  }

  /**
   * Resend OTP for admin registration
   */
  static async resendOtp(email: string): Promise<ApiResponse> {
    try {
      const response = await httpClient.post<ApiResponse>(
        API_ENDPOINTS.AUTH.RESEND_OTP,
        { email }
      );

      if (response.success) {
        return response;
      }

      throw new Error(response.error?.message || 'Failed to resend OTP');
    } catch (error: any) {
      // Handle ApiError from httpClient
      if (error.status && error.data) {
        throw new Error(error.data?.error?.message || error.message || 'Failed to resend OTP');
      }
      throw new Error(error.message || 'Failed to resend OTP');
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<{
        user: User;
        accessToken: string;
        expiresIn: number;
        refreshToken?: string;
      }>(
        API_ENDPOINTS.AUTH.REFRESH
      );

      if (response.success && response.data) {
        // Update stored tokens
        tokenManager.setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }

        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      throw new Error(response.error?.message || 'Token refresh failed');
    } catch (error: any) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    try {
      const response = await httpClient.get<{ user: User }>(
        API_ENDPOINTS.AUTH.PROFILE
      );

      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        return response.data.user;
      }

      throw new Error(response.error?.message || 'Failed to get profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get profile');
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      console.log('🚪 AuthService - Calling server logout endpoint');
      // Call logout endpoint to invalidate token on server
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      console.log('✅ AuthService - Server logout successful');
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('⚠️ AuthService - Server logout failed, continuing with local logout:', error);
    } finally {
      // Always clear local storage
      console.log('🧹 AuthService - Clearing all local storage');
      this.clearLocalStorage();
    }
  }

  /**
   * Clear local storage and tokens
   */
  static clearLocalStorage(): void {
    console.log('🧹 AuthService - Clearing all authentication data');

    // Remove tokens using token manager
    tokenManager.removeToken();

    // Remove user data and refresh token
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    // Clear any other auth-related items (comprehensive cleanup)
    const authKeys = [
      'vcba_auth_token',
      'vcba_user_data',
      'vcba_refresh_token',
      'auth_token',
      'user_data',
      'refresh_token'
    ];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
    });

    // Clear any session storage as well
    sessionStorage.clear();

    console.log('✅ AuthService - All authentication data cleared');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = tokenManager.getToken();
    const userData = this.getStoredUser();
    return !!(token && userData);
  }

  /**
   * Get stored user data
   */
  static getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  /**
   * Validate current session - DISABLED TO PREVENT LOGOUTS
   */
  static async validateSession(): Promise<boolean> {
    // ALWAYS RETURN TRUE - No validation to prevent unwanted logouts
    console.log('AuthService.validateSession - DISABLED, always returning true');
    return true;
  }

  /**
   * Get user role
   */
  static getUserRole(): 'admin' | 'student' | null {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: 'admin' | 'student'): boolean {
    return this.getUserRole() === role;
  }
}

export default AuthService;
