import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationNavigationService } from '../services/notificationNavigationService';
import { Notification } from '../services/notificationService';

/**
 * Professional React Hook for Notification Navigation
 * Handles notification click behavior and deep linking
 * Following Google/OpenAI React best practices
 */

interface UseNotificationNavigationOptions {
  userRole: 'admin' | 'student';
  onNavigationStart?: (notification: Notification) => void;
  onNavigationComplete?: (notification: Notification, success: boolean) => void;
  onNavigationError?: (error: Error, notification: Notification) => void;
}

interface UseNotificationNavigationReturn {
  handleNotificationClick: (notification: Notification) => Promise<void>;
  isNavigating: boolean;
  lastNavigatedNotification: Notification | null;
}

export const useNotificationNavigation = (
  options: UseNotificationNavigationOptions
): UseNotificationNavigationReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, onNavigationStart, onNavigationComplete, onNavigationError } = options;

  // Initialize navigation service
  useEffect(() => {
    notificationNavigationService.initialize(navigate, userRole);
  }, [navigate, userRole]);

  // Handle URL parameters for deep linking
  useEffect(() => {
    const handleDeepLink = async () => {
      const urlParams = new URLSearchParams(location.search);
      const notificationId = urlParams.get('notification');
      const focusType = urlParams.get('focus');
      const targetId = urlParams.get('id');
      const commentId = urlParams.get('comment');

      if (notificationId || (focusType && targetId)) {
        console.log('🔗 Deep link detected:', { notificationId, focusType, targetId, commentId });
        
        // Handle highlighting and scrolling for deep links
        setTimeout(() => {
          handleDeepLinkHighlighting(focusType, targetId, commentId);
        }, 500); // Allow page to render first
      }
    };

    handleDeepLink();
  }, [location]);

  // Handle deep link highlighting and scrolling
  const handleDeepLinkHighlighting = useCallback((
    focusType: string | null,
    targetId: string | null,
    commentId: string | null
  ) => {
    try {
      let targetElement: HTMLElement | null = null;

      // Find target element based on focus type
      if (focusType === 'announcement' && targetId) {
        targetElement = document.getElementById(`announcement-${targetId}`);
      } else if (focusType === 'comment' && commentId) {
        targetElement = document.getElementById(`comment-${commentId}`);
      } else if (focusType === 'event' && targetId) {
        targetElement = document.getElementById(`event-${targetId}`);
      }

      if (targetElement) {
        // Smooth scroll to target
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Add highlight effect
        targetElement.classList.add('notification-highlight');
        
        // Remove highlight after animation
        setTimeout(() => {
          targetElement?.classList.remove('notification-highlight');
        }, 3000);

        console.log('✨ Highlighted target element:', targetElement.id);
      } else {
        console.warn('🎯 Target element not found for deep link');
      }
    } catch (error) {
      console.error('Error handling deep link highlighting:', error);
    }
  }, []);

  // Main notification click handler
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      console.log('🔔 Handling notification click:', notification);
      
      // Trigger navigation start callback
      onNavigationStart?.(notification);

      // Use navigation service to handle the click
      const success = await notificationNavigationService.handleNotificationClick(
        notification,
        {
          markAsRead: true,
          highlightTarget: true,
          scrollBehavior: 'smooth'
        }
      );

      // Trigger navigation complete callback
      onNavigationComplete?.(notification, success);

      if (!success) {
        throw new Error('Navigation failed');
      }

    } catch (error) {
      console.error('Error in notification click handler:', error);
      onNavigationError?.(error as Error, notification);
      
      // Fallback navigation
      const fallbackRoute = userRole === 'admin' ? '/admin/announcement-approval' : '/student/newsfeed';
      navigate(fallbackRoute);
    }
  }, [navigate, userRole, onNavigationStart, onNavigationComplete, onNavigationError]);

  return {
    handleNotificationClick,
    isNavigating: false, // Could be enhanced with loading state
    lastNavigatedNotification: null // Could be enhanced with state tracking
  };
};

// Define the navigation state interface
interface NavigationState {
  fromNotification?: boolean;
  notificationId?: number;
  highlightTarget?: boolean;
  scrollTo?: string;
  scrollBehavior?: ScrollBehavior;
}

/**
 * Hook for handling notification-triggered page behavior
 * Use this in pages that can be targets of notification navigation
 */
export const useNotificationTarget = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if we arrived here from a notification
    const state = location.state as NavigationState;

    if (state?.fromNotification) {
      console.log('📍 Page loaded from notification:', state);

      // Handle highlighting and scrolling
      if (state.scrollTo && state.highlightTarget) {
        setTimeout(() => {
          const targetElement = document.getElementById(state.scrollTo!);

          if (targetElement) {
            // Scroll to target
            targetElement.scrollIntoView({
              behavior: (state.scrollBehavior || 'smooth') as ScrollBehavior,
              block: 'center',
              inline: 'nearest'
            });

            // Add highlight effect
            targetElement.classList.add('notification-highlight');

            // Remove highlight after animation
            setTimeout(() => {
              targetElement.classList.remove('notification-highlight');
            }, 3000);

            console.log('✨ Auto-highlighted notification target:', state.scrollTo);
          }
        }, 300); // Allow page to render
      }
    }
  }, [location]);

  const state = location.state as NavigationState;

  return {
    isFromNotification: state?.fromNotification || false,
    notificationId: state?.notificationId || null,
    scrollTarget: state?.scrollTo || null
  };
};

/**
 * Hook for managing notification read status
 */
export const useNotificationReadStatus = () => {
  const markAsRead = useCallback(async (notificationId: number, userRole: 'admin' | 'student') => {
    try {
      // Import notification service dynamically
      const { studentNotificationService, adminNotificationService } = await import('../services/notificationService');
      
      const service = userRole === 'admin' ? adminNotificationService : studentNotificationService;
      await service.markAsRead(notificationId);
      
      console.log('✅ Marked notification as read:', notificationId);
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (userRole: 'admin' | 'student') => {
    try {
      // Import notification service dynamically
      const { studentNotificationService, adminNotificationService } = await import('../services/notificationService');
      
      const service = userRole === 'admin' ? adminNotificationService : studentNotificationService;
      await service.markAllAsRead();
      
      console.log('✅ Marked all notifications as read');
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }, []);

  return {
    markAsRead,
    markAllAsRead
  };
};

export default useNotificationNavigation;
