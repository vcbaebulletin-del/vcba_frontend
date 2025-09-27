import { NavigateFunction } from 'react-router-dom';
import { Notification } from './notificationService';

/**
 * Professional Notification Navigation Service
 * Handles context-aware redirection based on notification metadata
 * Following Google/OpenAI software engineering practices
 */

export interface NotificationContext {
  type: 'comment' | 'announcement' | 'calendar' | 'general';
  target_id: number | null;
  announcement_id?: number;
  parent_comment_id?: number;
  event_date?: string;
  scroll_to?: string;
}

export interface NavigationOptions {
  markAsRead?: boolean;
  highlightTarget?: boolean;
  scrollBehavior?: ScrollBehavior;
  fallbackRoute?: string;
}

class NotificationNavigationService {
  private navigate: NavigateFunction | null = null;
  private currentUserRole: 'admin' | 'student' | null = null;

  /**
   * Initialize the navigation service with React Router navigate function
   */
  initialize(navigate: NavigateFunction, userRole: 'admin' | 'student') {
    this.navigate = navigate;
    this.currentUserRole = userRole;
  }

  /**
   * Handle notification click with context-aware redirection
   */
  async handleNotificationClick(
    notification: Notification,
    options: NavigationOptions = {}
  ): Promise<boolean> {
    if (!this.navigate || !this.currentUserRole) {
      console.error('NotificationNavigationService not initialized');
      return false;
    }

    try {
      // Parse context metadata
      const context = this.parseNotificationContext(notification);
      
      // Mark as read if requested
      if (options.markAsRead !== false) {
        await this.markNotificationAsRead(notification.notification_id);
      }

      // Determine target route
      const targetRoute = this.buildTargetRoute(context, this.currentUserRole);
      
      if (!targetRoute) {
        console.warn('Unable to determine target route for notification:', notification);
        return this.handleFallback(options.fallbackRoute);
      }

      // Navigate to target with state for highlighting and scrolling
      const navigationState = {
        fromNotification: true,
        notificationId: notification.notification_id,
        highlightTarget: options.highlightTarget !== false,
        scrollTo: context.scroll_to,
        scrollBehavior: (options.scrollBehavior || 'smooth') as ScrollBehavior
      };

      this.navigate(targetRoute, { state: navigationState });
      
      console.log('🎯 Navigated to:', targetRoute, 'with state:', navigationState);
      return true;

    } catch (error) {
      console.error('Error handling notification click:', error);
      return this.handleFallback(options.fallbackRoute);
    }
  }

  /**
   * Parse notification context metadata
   */
  private parseNotificationContext(notification: Notification): NotificationContext {
    try {
      // Handle both string and object context_metadata
      let contextData: NotificationContext;
      
      if (typeof notification.context_metadata === 'string') {
        contextData = JSON.parse(notification.context_metadata);
      } else if (typeof notification.context_metadata === 'object' && notification.context_metadata !== null) {
        contextData = notification.context_metadata as NotificationContext;
      } else {
        // Fallback: infer context from notification type and related IDs
        contextData = this.inferContextFromNotification(notification);
      }

      return contextData;
    } catch (error) {
      console.warn('Failed to parse notification context, using fallback:', error);
      return this.inferContextFromNotification(notification);
    }
  }

  /**
   * Infer context from notification data when metadata is not available
   */
  private inferContextFromNotification(notification: Notification): NotificationContext {
    const { type_name, related_announcement_id, related_comment_id } = notification;

    // Comment-related notifications
    if (type_name && ['comment_reply', 'comment_reaction', 'comment_flagged'].includes(type_name)) {
      return {
        type: 'comment',
        target_id: related_comment_id || null,
        announcement_id: related_announcement_id,
        scroll_to: related_comment_id ? `comment-${related_comment_id}` : undefined
      };
    }

    // Announcement-related notifications
    if (type_name && ['new_announcement', 'alert_announcement', 'announcement_reaction', 'pinned_post'].includes(type_name)) {
      return {
        type: 'announcement',
        target_id: related_announcement_id || null,
        announcement_id: related_announcement_id,
        scroll_to: related_announcement_id ? `announcement-${related_announcement_id}` : undefined
      };
    }

    // Calendar-related notifications
    if (type_name === 'calendar_event') {
      return {
        type: 'calendar',
        target_id: related_announcement_id || null, // Calendar events might use announcement_id field
        scroll_to: related_announcement_id ? `event-${related_announcement_id}` : undefined
      };
    }

    // General fallback
    return {
      type: 'general',
      target_id: null
    };
  }

  /**
   * Build target route based on context and user role
   */
  private buildTargetRoute(context: NotificationContext, userRole: 'admin' | 'student'): string | null {
    const baseRoute = userRole === 'admin' ? '/admin' : '/student';

    switch (context.type) {
      case 'comment':
        if (context.announcement_id) {
          // Navigate to newsfeed with announcement focus
          return `${baseRoute}/newsfeed?focus=announcement&id=${context.announcement_id}&comment=${context.target_id}`;
        }
        return `${baseRoute}/newsfeed`;

      case 'announcement':
        if (context.target_id) {
          // Navigate to newsfeed with announcement focus
          return `${baseRoute}/newsfeed?focus=announcement&id=${context.target_id}`;
        }
        return `${baseRoute}/newsfeed`;

      case 'calendar':
        if (context.target_id) {
          // Navigate to calendar with event focus
          return `${baseRoute}/calendar?focus=event&id=${context.target_id}`;
        }
        return `${baseRoute}/calendar`;

      case 'general':
      default:
        // Navigate to dashboard or newsfeed as fallback
        return `${baseRoute}/newsfeed`;
    }
  }

  /**
   * Mark notification as read
   */
  private async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { studentNotificationService, adminNotificationService } = await import('./notificationService');
      
      const service = this.currentUserRole === 'admin' ? adminNotificationService : studentNotificationService;
      await service.markAsRead(notificationId);
      
      console.log('✅ Marked notification as read:', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Don't throw - this shouldn't prevent navigation
    }
  }

  /**
   * Handle fallback navigation when target route cannot be determined
   */
  private handleFallback(fallbackRoute?: string): boolean {
    if (!this.navigate || !this.currentUserRole) return false;

    const defaultFallback = this.currentUserRole === 'admin' ? '/admin/announcement-approval' : '/student/newsfeed';
    const targetRoute = fallbackRoute || defaultFallback;

    this.navigate(targetRoute);
    console.log('🔄 Fallback navigation to:', targetRoute);
    return true;
  }

  /**
   * Validate if target content still exists (for error handling)
   */
  async validateTarget(context: NotificationContext): Promise<boolean> {
    try {
      // This would typically make API calls to verify content exists
      // For now, we'll implement basic validation
      
      if (context.type === 'announcement' && context.target_id) {
        // Could check if announcement still exists and is accessible
        return true;
      }

      if (context.type === 'comment' && context.target_id) {
        // Could check if comment still exists and is not deleted
        return true;
      }

      if (context.type === 'calendar' && context.target_id) {
        // Could check if calendar event still exists
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error validating target:', error);
      return false;
    }
  }

  /**
   * Get user-friendly error message for invalid targets
   */
  getTargetErrorMessage(context: NotificationContext): string {
    switch (context.type) {
      case 'announcement':
        return 'This announcement is no longer available or has been removed.';
      case 'comment':
        return 'This comment is no longer available or has been removed.';
      case 'calendar':
        return 'This calendar event is no longer available or has been removed.';
      default:
        return 'The content you\'re looking for is no longer available.';
    }
  }

  /**
   * Generate deep link URL for sharing notifications
   */
  generateDeepLink(notification: Notification, baseUrl: string = window.location.origin): string {
    const context = this.parseNotificationContext(notification);
    const userRole = this.currentUserRole || 'student';
    const targetRoute = this.buildTargetRoute(context, userRole);
    
    if (targetRoute) {
      return `${baseUrl}${targetRoute}&notification=${notification.notification_id}`;
    }
    
    return `${baseUrl}/${userRole}/dashboard`;
  }

  /**
   * Handle browser back navigation after notification click
   */
  handleBackNavigation(): void {
    // This could be enhanced to provide smart back navigation
    // For now, we'll let the browser handle it naturally
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const fallbackRoute = this.currentUserRole === 'admin' ? '/admin/announcement-approval' : '/student/newsfeed';
      this.navigate?.(fallbackRoute);
    }
  }
}

// Export singleton instance
export const notificationNavigationService = new NotificationNavigationService();
export default notificationNavigationService;
