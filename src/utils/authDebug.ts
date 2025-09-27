/**
 * Authentication Debug Utilities
 * Professional debugging tools for authentication flow
 */

export const AuthDebug = {
  /**
   * Log authentication state for debugging
   */
  logAuthState(context: string, authState: any) {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔐 Auth Debug - ${context}`);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Auth State:', {
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        user: authState.user ? {
          id: authState.user.id,
          email: authState.user.email,
          role: authState.user.role,
          firstName: authState.user.firstName,
          lastName: authState.user.lastName
        } : null,
        error: authState.error
      });
      console.log('Local Storage Token:', !!localStorage.getItem('auth_token'));
      console.log('Local Storage User:', !!localStorage.getItem('user_data'));
      console.groupEnd();
    }
  },

  /**
   * Log route protection events
   */
  logRouteProtection(route: string, action: string, details?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛡️ Route Protection - ${route}: ${action}`, details || '');
    }
  },

  /**
   * Log API call events
   */
  logApiCall(endpoint: string, method: string, status?: number, error?: any) {
    if (process.env.NODE_ENV === 'development') {
      const emoji = status && status < 400 ? '✅' : '❌';
      console.log(`${emoji} API Call - ${method} ${endpoint}`, {
        status,
        error: error?.message
      });
    }
  },

  /**
   * Check authentication health
   */
  checkAuthHealth() {
    if (process.env.NODE_ENV === 'development') {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      console.group('🏥 Auth Health Check');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('User data exists:', !!userData);
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('User data valid:', !!user.id && !!user.role);
          console.log('User role:', user.role);
        } catch (e) {
          console.error('User data corrupted:', e);
        }
      }
      
      console.groupEnd();
    }
  }
};

export default AuthDebug;
