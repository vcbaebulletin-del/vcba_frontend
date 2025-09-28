import axios from 'axios';
import { ADMIN_AUTH_TOKEN_KEY, API_BASE_URL } from '../config/constants';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    console.log('🔑 API Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
      tokenKey: ADMIN_AUTH_TOKEN_KEY
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ API Request - No admin token found in localStorage with key:', ADMIN_AUTH_TOKEN_KEY);
      console.warn('⚠️ Available localStorage keys:', Object.keys(localStorage));
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    };

    console.error('❌ API Response Error:', errorDetails);

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.warn('🚨 API Response - Unauthorized access detected');
      // Clear the admin token
      localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
      console.warn('🧹 Cleared admin token due to 401 error');
      // Don't auto-redirect to allow proper error handling in components
    } else if (error.response?.status === 404) {
      console.warn('🔍 API Response - Endpoint not found:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        suggestion: 'Check if the backend server is running and the endpoint exists'
      });
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Cannot connect to server:', {
        baseURL: error.config?.baseURL,
        suggestion: 'Check if the backend server is running on the correct port'
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
