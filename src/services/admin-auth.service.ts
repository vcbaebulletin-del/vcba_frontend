// import { httpClient } from './api.service'; // Not needed - using custom fetch
import { API_ENDPOINTS, ADMIN_USER_DATA_KEY, ADMIN_REFRESH_TOKEN_KEY, ADMIN_AUTH_TOKEN_KEY, API_BASE_URL } from '../config/constants';
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

// Admin-specific token manager
class AdminTokenManager {
  getToken(): string | null {
    return localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

const adminTokenManager = new AdminTokenManager();

export class AdminAuthService {
  /**
   * Custom request method with admin token
   */
  public static async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    retryCount: number = 0
  ): Promise<any> {
    const token = adminTokenManager.getToken();
    console.log('🔍 DEBUG - Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NULL');
    console.log('🔍 DEBUG - localStorage keys:', Object.keys(localStorage));
    console.log('🔍 DEBUG - ADMIN_AUTH_TOKEN_KEY:', ADMIN_AUTH_TOKEN_KEY);

    const headers: Record<string, string> = {};

    // Only set Content-Type for non-FormData requests
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔍 DEBUG - Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.error('❌ DEBUG - No token found, request will fail with 401');
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      // Handle FormData differently - don't stringify it
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      console.log(`🔄 Admin API Request: ${method} ${url}`);
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid - clear auth and redirect
          adminTokenManager.removeToken();
          throw new Error('Authentication required');
        }

        const responseData = await response.json().catch(() => ({ message: 'Request failed' }));
        const errorMessage = responseData?.message || responseData?.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log(`✅ Admin API Success: ${method} ${endpoint}`);
      return responseData;
    } catch (error) {
      console.error(`❌ Admin API request failed: ${method} ${endpoint}`, error);

      // Retry logic for network errors
      if (retryCount < 2 && (error instanceof TypeError || (error instanceof Error && error.message.includes('Failed to fetch')))) {
        console.log(`🔄 Retrying request (attempt ${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.request<T>(method, endpoint, data, retryCount + 1);
      }

      // Enhanced error information for connection issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`❌ Network connection failed. Please check:\n1. Backend server is running on ${API_BASE_URL}\n2. CORS is properly configured\n3. No firewall blocking the connection`);
      }

      throw error;
    }
  }

  /**
   * Get current authenticated admin user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = adminTokenManager.getToken();
      if (!token) {
        return null;
      }

      const response = await this.request<{ user: User }>('GET', API_ENDPOINTS.AUTH.PROFILE);

      if (response && response.user) {
        return response.user;
      }

      return null;
    } catch (error) {
      console.error('Failed to get current admin user:', error);
      return null;
    }
  }

  /**
   * Login admin user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.LOGIN, { ...credentials, userType: 'admin' });

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

        // Verify the user is actually an admin
        if (transformedUser.role !== 'admin') {
          throw new Error('Access denied: Admin privileges required');
        }

        // Store tokens and transformed user data in admin-specific keys
        adminTokenManager.setToken(response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
        localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(transformedUser));

        return {
          success: true,
          message: response.message || 'Admin login successful',
          data: {
            ...response.data,
            user: transformedUser,
          },
        };
      }

      throw new Error(response?.message || 'Admin login failed');
    } catch (error: any) {
      console.error('AdminAuthService.login error:', error);
      throw new Error(error.message || 'Admin login failed');
    }
  }

  /**
   * Register admin user
   */
  static async registerAdmin(data: AdminRegistrationData): Promise<RegistrationResponse> {
    try {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.ADMIN_REGISTER, data);

      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'Admin registration initiated successfully',
          data: response.data,
        };
      }

      throw new Error(response?.message || 'Admin registration failed');
    } catch (error: any) {
      console.error('AdminAuthService.registerAdmin error:', error);
      throw new Error(error.message || 'Admin registration failed');
    }
  }

  /**
   * Verify OTP for admin registration
   */
  static async verifyOtp(data: OtpVerificationData): Promise<OtpVerificationResponse> {
    try {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.VERIFY_OTP, data);

      if (response && response.success) {
        return {
          success: true,
          message: response.message || 'OTP verification successful',
          data: response.data,
        };
      }

      throw new Error(response?.message || 'OTP verification failed');
    } catch (error: any) {
      console.error('AdminAuthService.verifyOtp error:', error);
      throw new Error(error.message || 'OTP verification failed');
    }
  }

  /**
   * Resend OTP for admin registration
   */
  static async resendOtp(email: string): Promise<ApiResponse> {
    try {
      const response = await this.request('POST', API_ENDPOINTS.AUTH.RESEND_OTP, { email });

      if (response && response.success) {
        return response;
      }

      throw new Error(response?.message || 'Failed to resend OTP');
    } catch (error: any) {
      console.error('AdminAuthService.resendOtp error:', error);
      throw new Error(error.message || 'Failed to resend OTP');
    }
  }

  /**
   * Logout admin user
   */
  static async logout(): Promise<void> {
    try {
      console.log('🚪 AdminAuthService - Calling server logout endpoint');
      await this.request('POST', API_ENDPOINTS.AUTH.LOGOUT);
      console.log('✅ AdminAuthService - Server logout successful');
    } catch (error) {
      console.warn('⚠️ AdminAuthService - Server logout failed, continuing with local logout:', error);
    } finally {
      console.log('🧹 AdminAuthService - Clearing admin local storage');
      this.clearLocalStorage();
    }
  }

  /**
   * Clear admin local storage and tokens
   */
  static clearLocalStorage(): void {
    console.log('🧹 AdminAuthService - Clearing admin authentication data');
    adminTokenManager.removeToken();
    localStorage.removeItem(ADMIN_USER_DATA_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    console.log('✅ AdminAuthService - Admin authentication data cleared');
  }

  /**
   * Check if admin is authenticated
   */
  static isAuthenticated(): boolean {
    const token = adminTokenManager.getToken();
    const userData = this.getStoredUser();
    return !!(token && userData && userData.role === 'admin');
  }

  /**
   * Get stored admin user data
   */
  static getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem(ADMIN_USER_DATA_KEY);
      const user = userData ? JSON.parse(userData) : null;
      return user && user.role === 'admin' ? user : null;
    } catch (error) {
      console.error('Error parsing stored admin user data:', error);
      return null;
    }
  }

  /**
   * Get admin user role
   */
  static getUserRole(): 'admin' | null {
    const user = this.getStoredUser();
    return user?.role === 'admin' ? 'admin' : null;
  }

  /**
   * HTTP GET method with admin authentication
   */
  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('GET', endpoint);
  }

  /**
   * HTTP POST method with admin authentication
   */
  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('POST', endpoint, data);
  }

  /**
   * HTTP PUT method with admin authentication
   */
  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('PUT', endpoint, data);
  }

  /**
   * HTTP PATCH method with admin authentication
   */
  static async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('PATCH', endpoint, data);
  }

  /**
   * HTTP DELETE method with admin authentication
   */
  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>('DELETE', endpoint);
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(file: File): Promise<{ admin: User; profilePicture: string }> {
    console.log('📤 AdminAuthService - Uploading profile picture:', file.name);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      // Use the existing request method which handles authentication properly
      const result = await this.request('POST', '/api/admin/profile/picture', formData);

      console.log('✅ AdminAuthService - Profile picture uploaded successfully');

      // Transform the admin data
      const rawAdmin = result.data.admin;
      const transformedAdmin: User = {
        id: rawAdmin.admin_id,
        email: rawAdmin.email,
        role: 'admin',
        firstName: rawAdmin.first_name,
        lastName: rawAdmin.last_name,
        middleName: rawAdmin.middle_name,
        suffix: rawAdmin.suffix,
        phoneNumber: rawAdmin.phone_number,
        department: rawAdmin.department,
        position: rawAdmin.position,
        grade_level: rawAdmin.grade_level,
        profilePicture: rawAdmin.profile_picture,
        isActive: Boolean(rawAdmin.is_active),
        lastLogin: rawAdmin.last_login,
        createdAt: rawAdmin.account_created_at,
        updatedAt: rawAdmin.account_updated_at,
      };

      // Update stored user data
      localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(transformedAdmin));

      return {
        admin: transformedAdmin,
        profilePicture: result.data.profilePicture
      };
    } catch (error: any) {
      console.error('❌ AdminAuthService - Profile picture upload failed:', error);
      throw error;
    }
  }

  /**
   * Remove profile picture
   */
  static async removeProfilePicture(): Promise<User> {
    console.log('🗑️ AdminAuthService - Removing profile picture');

    // Don't use auth for profile picture operations - make direct fetch request
    const fetchResponse = await fetch(`${API_BASE_URL}/api/admin/profile/picture/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove profile picture');
    }

    console.log('✅ AdminAuthService - Profile picture removed successfully');

    // Transform the admin data
    const rawAdmin = response.data.admin;
    const transformedAdmin: User = {
      id: rawAdmin.admin_id,
      email: rawAdmin.email,
      role: 'admin',
      firstName: rawAdmin.first_name,
      lastName: rawAdmin.last_name,
      middleName: rawAdmin.middle_name,
      suffix: rawAdmin.suffix,
      phoneNumber: rawAdmin.phone_number,
      department: rawAdmin.department,
      position: rawAdmin.position,
      grade_level: rawAdmin.grade_level,
      profilePicture: rawAdmin.profile_picture,
      isActive: Boolean(rawAdmin.is_active),
      lastLogin: rawAdmin.last_login,
      createdAt: rawAdmin.account_created_at,
      updatedAt: rawAdmin.account_updated_at,
    };

    // Update stored user data
    localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(transformedAdmin));

    return transformedAdmin;
  }

  // Change password
  static async changePassword(data: { currentPassword: string; newPassword: string }) {
    console.log('🔍 AdminAuthService - Changing password...');

    try {
      const token = adminTokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to change password');
      }

      console.log('✅ AdminAuthService - Password changed successfully');
      return result;
    } catch (error: any) {
      console.error('❌ AdminAuthService - Change password failed:', error.message);
      throw error;
    }
  }
}

export default AdminAuthService;
