import { ApiError } from '../services/api.service';

export interface ErrorDisplayInfo {
  title: string;
  message: string;
  actionable: boolean;
  suggestions: string[];
}

export class ErrorHandler {
  static getDisplayInfo(error: any): ErrorDisplayInfo {
    // Handle API errors
    if (error instanceof ApiError) {
      return this.handleApiError(error);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        actionable: true,
        suggestions: [
          'Check if the backend server is running',
          'Verify your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      };
    }

    // Handle generic errors
    return {
      title: 'Unexpected Error',
      message: error.message || 'An unexpected error occurred',
      actionable: false,
      suggestions: ['Try refreshing the page', 'Contact support if the problem persists']
    };
  }

  private static handleApiError(error: ApiError): ErrorDisplayInfo {
    switch (error.status) {
      case 0:
        return {
          title: 'Server Connection Failed',
          message: error.message,
          actionable: true,
          suggestions: [
            'Ensure the backend server is running on the correct port',
            'Check if the server URL is correct in your configuration',
            'Verify network connectivity',
            'Try again in a few moments'
          ]
        };

      case 401:
        return {
          title: 'Authentication Required',
          message: 'Please log in to access this resource',
          actionable: true,
          suggestions: ['Log in with your credentials', 'Check if your session has expired']
        };

      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource',
          actionable: false,
          suggestions: ['Contact an administrator for access']
        };

      case 404:
        return {
          title: 'Resource Not Found',
          message: 'The requested resource could not be found',
          actionable: false,
          suggestions: ['Check the URL', 'Try navigating from the main page']
        };

      case 500:
        return {
          title: 'Server Error',
          message: 'An internal server error occurred',
          actionable: true,
          suggestions: ['Try again later', 'Contact support if the problem persists']
        };

      default:
        return {
          title: 'Request Failed',
          message: error.message,
          actionable: true,
          suggestions: ['Try again', 'Contact support if the problem persists']
        };
    }
  }

  static logError(error: any, context?: string) {
    const errorInfo = this.getDisplayInfo(error);
    console.error(`[${context || 'Unknown'}] ${errorInfo.title}:`, {
      message: errorInfo.message,
      originalError: error,
      timestamp: new Date().toISOString()
    });
  }

  static showUserFriendlyError(error: any, context?: string): string {
    this.logError(error, context);
    const errorInfo = this.getDisplayInfo(error);
    return `${errorInfo.title}: ${errorInfo.message}`;
  }
}

// Utility function for React components
export const handleApiError = (error: any, context?: string) => {
  return ErrorHandler.showUserFriendlyError(error, context);
};
