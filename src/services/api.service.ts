import { API_BASE_URL, AUTH_TOKEN_KEY, ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY } from '../config/constants';
import { ApiResponse } from '../types';

// API configuration
const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Custom error class for API errors
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Base token manager interface
interface TokenManager {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  getAuthHeaders(): Record<string, string>;
}

// Generic token manager (legacy - for backward compatibility)
export const tokenManager: TokenManager = {
  getToken(): string | null {
    // First try the general auth token
    let token = localStorage.getItem(AUTH_TOKEN_KEY);

    // If not found, prioritize admin token over student token
    // This ensures admin sessions take precedence when both tokens exist
    if (!token) {
      token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    }

    // If still not found, try student-specific token as fallback
    if (!token) {
      token = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);
    }

    return token;
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

// Admin-specific token manager
export const adminTokenManager: TokenManager = {
  getToken(): string | null {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    console.log('🔑 Admin Token Manager - Getting token:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  },

  setToken(token: string): void {
    console.log('🔑 Admin Token Manager - Setting token:', `${token.substring(0, 20)}...`);
    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
  },

  removeToken(): void {
    console.log('🔑 Admin Token Manager - Removing token');
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('🔑 Admin Token Manager - Auth headers:', token ? 'Bearer token present' : 'No token');
    return headers;
  },
};

// Student-specific token manager
export const studentTokenManager: TokenManager = {
  getToken(): string | null {
    const token = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);
    console.log('🎓 Student Token Manager - Getting token:', token ? `${token.substring(0, 20)}...` : 'null');
    return token;
  },

  setToken(token: string): void {
    console.log('🎓 Student Token Manager - Setting token:', `${token.substring(0, 20)}...`);
    localStorage.setItem(STUDENT_AUTH_TOKEN_KEY, token);
  },

  removeToken(): void {
    console.log('🎓 Student Token Manager - Removing token');
    localStorage.removeItem(STUDENT_AUTH_TOKEN_KEY);
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('🎓 Student Token Manager - Auth headers:', token ? 'Bearer token present' : 'No token');
    return headers;
  },
};

// HTTP client class
class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private tokenManager: TokenManager;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}, customTokenManager?: TokenManager) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
    this.tokenManager = customTokenManager || tokenManager; // Use custom or default token manager
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Build headers properly handling different header types
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
    };

    // Handle options.headers which could be Headers object or plain object
    if (options.headers) {
      if (options.headers instanceof Headers) {
        // Convert Headers object to plain object
        options.headers.forEach((value, key) => {
          if (value !== undefined) {
            headers[key] = value;
          } else {
            delete headers[key]; // Remove header if value is undefined
          }
        });
      } else {
        // Plain object - spread it, but handle undefined values
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            headers[key] = value;
          } else {
            delete headers[key]; // Remove header if value is undefined
          }
        });
      }
    }

    // Only add auth headers if requested
    if (includeAuth) {
      Object.assign(headers, this.tokenManager.getAuthHeaders());
    }

    const config: RequestInit = {
      ...options,
      credentials: 'include', // Include cookies for refresh token
      headers,
    };

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);

      // Handle different content types
      let data: any;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Log response details for debugging
      console.log(`📡 API Response: ${response.status} ${response.statusText} for ${url}`);
      if (!response.ok) {
        console.error(`❌ API Error Details:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          data,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorMessage = data?.error?.message || data?.message || `HTTP ${response.status}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data;
    } catch (error) {
      // Enhanced error logging
      console.error(`🚨 API Request Failed:`, {
        url,
        method: config.method || 'GET',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        headers: config.headers,
        body: config.body
      });

      // Handle network errors
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle specific network connection errors
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          throw new ApiError(
            `Unable to connect to server at ${this.baseURL}. Please ensure the backend server is running.`,
            0,
            { originalError: error.message, endpoint }
          );
        }
      }

      // Handle other network errors
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.name === 'NetworkError' ||
            (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.includes('ERR_CONNECTION_REFUSED'))) {
          throw new ApiError(
            `Connection refused to ${this.baseURL}. Please check if the server is running on the correct port.`,
            0,
            { originalError: errorObj.message || String(error), endpoint }
          );
        }
      }

      throw new ApiError('An unexpected error occurred.', 0, { originalError: String(error), endpoint });
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  // Public GET method without authentication
  async getPublic<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' }, false);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    const options: RequestInit = {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    };

    // For FormData, don't set Content-Type - let browser set it with boundary
    if (isFormData) {
      options.headers = { 'Content-Type': undefined as any };
    }

    return this.request<T>(endpoint, options);
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    const options: RequestInit = {
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    };

    // For FormData, don't set Content-Type - let browser set it with boundary
    if (isFormData) {
      options.headers = { 'Content-Type': undefined as any };
    }

    return this.request<T>(endpoint, options);
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export HTTP client instances
export const httpClient = new HttpClient(API_CONFIG.baseURL, API_CONFIG.headers); // Default/legacy client
export const adminHttpClient = new HttpClient(API_CONFIG.baseURL, API_CONFIG.headers, adminTokenManager);
export const studentHttpClient = new HttpClient(API_CONFIG.baseURL, API_CONFIG.headers, studentTokenManager);

// Setup response interceptor for a specific client
const setupClientInterceptor = (client: HttpClient, clientTokenManager: TokenManager, onUnauthorized?: () => void) => {
  const originalRequest = client['request'].bind(client);

  client['request'] = async function<T>(endpoint: string, options: RequestInit = {}) {
    try {
      return await originalRequest<T>(endpoint, options);
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle unauthorized access
        if (error.status === 401 && onUnauthorized) {
          clientTokenManager.removeToken();
          onUnauthorized();
        }

        // DISABLED TOKEN REFRESH - Just log the error and continue
        if (error.status === 401) {
          console.warn('API Service - 401 error detected but token refresh DISABLED:', endpoint);
          // Don't attempt refresh, just let the error propagate
        }
      }

      throw error;
    }
  };
};

// Setup response interceptor for all clients
export const setupResponseInterceptor = (onUnauthorized?: () => void) => {
  setupClientInterceptor(httpClient, tokenManager, onUnauthorized);
  setupClientInterceptor(adminHttpClient, adminTokenManager, onUnauthorized);
  setupClientInterceptor(studentHttpClient, studentTokenManager, onUnauthorized);
};

export default httpClient;
