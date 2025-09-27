// import { httpClient } from './api.service'; // Not needed - using custom fetch
import { API_ENDPOINTS, STUDENT_USER_DATA_KEY, STUDENT_REFRESH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY, API_BASE_URL } from '../config/constants';
import {
  LoginCredentials,
  AuthResponse,
  User,
} from '../types';

// Student-specific token manager
class StudentTokenManager {
  getToken(): string | null {
    return localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(STUDENT_AUTH_TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(STUDENT_AUTH_TOKEN_KEY);
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

const studentTokenManager = new StudentTokenManager();

export class StudentAuthService {
  /**
   * Custom request method with student token
   */
  private static async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<any> {
    const token = studentTokenManager.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      // Handle error response with proper message
      const errorMessage = responseData?.message || responseData?.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  }

  /**
   * Get current authenticated student user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = studentTokenManager.getToken();
      if (!token) {
        return null;
      }

      const response = await this.request<{ user: User }>('GET', API_ENDPOINTS.AUTH.PROFILE);

      if (response && response.user) {
        return response.user;
      }

      return null;
    } catch (error) {
      console.error('Failed to get current student user:', error);
      return null;
    }
  }

  /**
   * Login student user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.LOGIN, { ...credentials, userType: 'student' });

      if (response && response.success && response.data) {
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

        // Verify the user is actually a student
        if (transformedUser.role !== 'student') {
          throw new Error('Access denied: Student account required');
        }

        // Store tokens and transformed user data in student-specific keys
        studentTokenManager.setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem(STUDENT_REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
        localStorage.setItem(STUDENT_USER_DATA_KEY, JSON.stringify(transformedUser));

        return {
          success: true,
          message: response.message || 'Student login successful',
          data: {
            ...response.data,
            user: transformedUser,
          },
        };
      }

      throw new Error(response?.message || 'Student login failed');
    } catch (error: any) {
      console.error('StudentAuthService.login error:', error);
      throw new Error(error.message || 'Student login failed');
    }
  }

  /**
   * Logout student user
   */
  static async logout(): Promise<void> {
    try {
      console.log('🚪 StudentAuthService - Calling server logout endpoint');
      await this.request('POST', API_ENDPOINTS.AUTH.LOGOUT);
      console.log('✅ StudentAuthService - Server logout successful');
    } catch (error) {
      console.warn('⚠️ StudentAuthService - Server logout failed, continuing with local logout:', error);
    } finally {
      console.log('🧹 StudentAuthService - Clearing student local storage');
      this.clearLocalStorage();
    }
  }

  /**
   * Clear student local storage and tokens
   */
  static clearLocalStorage(): void {
    console.log('🧹 StudentAuthService - Clearing student authentication data');
    studentTokenManager.removeToken();
    localStorage.removeItem(STUDENT_USER_DATA_KEY);
    localStorage.removeItem(STUDENT_REFRESH_TOKEN_KEY);
    console.log('✅ StudentAuthService - Student authentication data cleared');
  }

  /**
   * Check if student is authenticated
   */
  static isAuthenticated(): boolean {
    const token = studentTokenManager.getToken();
    const userData = this.getStoredUser();
    return !!(token && userData && userData.role === 'student');
  }

  /**
   * Get stored student user data
   */
  static getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(STUDENT_USER_DATA_KEY);
      const user = userData ? JSON.parse(userData) : null;
      return user && user.role === 'student' ? user : null;
    } catch (error) {
      console.error('Error parsing stored student user data:', error);
      return null;
    }
  }

  /**
   * Get student user role
   */
  static getUserRole(): 'student' | null {
    const user = this.getStoredUser();
    return user?.role === 'student' ? 'student' : null;
  }

  /**
   * Refresh student access token
   */
  static async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem(STUDENT_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.request('POST', API_ENDPOINTS.AUTH.REFRESH, { refreshToken });

      if (response && response.success && response.data) {
        // Update stored tokens
        studentTokenManager.setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem(STUDENT_REFRESH_TOKEN_KEY, response.data.refreshToken);
        }

        return {
          success: true,
          message: response.message,
          data: response.data,
        };
      }

      throw new Error(response?.message || 'Token refresh failed');
    } catch (error: any) {
      console.error('StudentAuthService.refreshToken error:', error);
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  /**
   * Get student profile
   */
  static async getProfile(): Promise<User> {
    try {
      const response = await this.request<{ user: User }>('GET', API_ENDPOINTS.AUTH.PROFILE);

      if (response && response.user) {
        // Update stored user data
        localStorage.setItem(STUDENT_USER_DATA_KEY, JSON.stringify(response.user));
        return response.user;
      }

      throw new Error(response.error?.message || 'Failed to get profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get profile');
    }
  }
}

export default StudentAuthService;
