import { httpClient, adminHttpClient, studentHttpClient } from './api.service';
import { AdminAuthService } from './admin-auth.service';
import { API_ENDPOINTS, STUDENT_AUTH_TOKEN_KEY, ADMIN_AUTH_TOKEN_KEY, ADMIN_USER_DATA_KEY, STUDENT_USER_DATA_KEY, API_BASE_URL } from '../config/constants';
import { ApiResponse } from '../types';

// Types for notifications
export interface Notification {
  notification_id: number;
  recipient_type: 'admin' | 'student';
  recipient_id: number;
  notification_type_id: number;
  title: string;
  message: string;
  related_announcement_id?: number;
  related_comment_id?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  // Enhanced metadata for navigation
  type_name?: string;
  context_metadata?: string | {
    type: 'comment' | 'announcement' | 'calendar' | 'general';
    target_id: number | null;
    announcement_id?: number;
    parent_comment_id?: number;
    event_date?: string;
    scroll_to?: string;
  };
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  is_read?: boolean;
  notification_type_id?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedNotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class NotificationService {
  // Role-based authentication context detection (similar to comment service)
  private getCurrentUserAuth(preferredUserType?: 'admin' | 'student'): {
    useStudentAuth: boolean;
    token: string | null;
    userType: 'admin' | 'student';
  } {
    const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    const studentToken = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);
    const adminUser = localStorage.getItem(ADMIN_USER_DATA_KEY);
    const studentUser = localStorage.getItem(STUDENT_USER_DATA_KEY);

    console.log('🔍 NotificationService - Detecting user authentication context:', {
      preferredUserType,
      hasAdminToken: !!adminToken,
      hasStudentToken: !!studentToken,
      hasAdminUser: !!adminUser,
      hasStudentUser: !!studentUser,
      currentPath: window.location.pathname
    });

    // If a preferred user type is specified, use that context first
    if (preferredUserType === 'admin' && adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        if (userData.role === 'admin') {
          console.log('🔑 NotificationService - Using admin authentication (preferred)');
          return { useStudentAuth: false, token: adminToken, userType: 'admin' };
        }
      } catch (e) {
        console.warn('Failed to parse admin user data');
      }
    }

    if (preferredUserType === 'student' && studentToken && studentUser) {
      try {
        const userData = JSON.parse(studentUser);
        if (userData.role === 'student') {
          console.log('🔑 NotificationService - Using student authentication (preferred)');
          return { useStudentAuth: true, token: studentToken, userType: 'student' };
        }
      } catch (e) {
        console.warn('Failed to parse student user data');
      }
    }

    // If no preference specified, determine based on current page context
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('/admin');
    const isStudentPage = currentPath.includes('/student');

    if (isAdminPage && adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        if (userData.role === 'admin') {
          console.log('🔑 NotificationService - Using admin authentication (admin page context)');
          return { useStudentAuth: false, token: adminToken, userType: 'admin' };
        }
      } catch (e) {
        console.warn('Failed to parse admin user data');
      }
    }

    if (isStudentPage && studentToken && studentUser) {
      try {
        const userData = JSON.parse(studentUser);
        if (userData.role === 'student') {
          console.log('🔑 NotificationService - Using student authentication (student page context)');
          return { useStudentAuth: true, token: studentToken, userType: 'student' };
        }
      } catch (e) {
        console.warn('Failed to parse student user data');
      }
    }

    // Fallback: Use student authentication if available (prioritize student over admin)
    if (studentToken && studentUser) {
      try {
        const userData = JSON.parse(studentUser);
        if (userData.role === 'student') {
          console.log('🔑 NotificationService - Using student authentication (fallback)');
          return { useStudentAuth: true, token: studentToken, userType: 'student' };
        }
      } catch (e) {
        console.warn('Failed to parse student user data');
      }
    }

    // Then try admin authentication
    if (adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        if (userData.role === 'admin') {
          console.log('🔑 NotificationService - Using admin authentication (fallback)');
          return { useStudentAuth: false, token: adminToken, userType: 'admin' };
        }
      } catch (e) {
        console.warn('Failed to parse admin user data');
      }
    }

    // Last resort: check tokens without user data validation (prioritize student)
    if (studentToken) {
      console.log('🔑 NotificationService - Using student token (no user data)');
      return { useStudentAuth: true, token: studentToken, userType: 'student' };
    }

    if (adminToken) {
      console.log('🔑 NotificationService - Using admin token (no user data)');
      return { useStudentAuth: false, token: adminToken, userType: 'admin' };
    }

    // No authentication available
    console.warn('⚠️ NotificationService - No authentication context available');
    throw new Error('No authentication context available');
  }

  // Get user notifications with role-based authentication
  async getNotifications(filters?: NotificationFilters, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    const { useStudentAuth, token, userType } = this.getCurrentUserAuth(preferredUserType);

    // Log authentication context for debugging
    console.log('NotificationService.getNotifications - Auth context:', {
      preferredUserType,
      useStudentAuth,
      hasToken: !!token,
      userType,
      tokenPrefix: token ? token.substring(0, 10) + '...' : null
    });

    const params = filters ? this.buildQueryParams(filters) : undefined;

    // Use specific authentication if we have a token
    if (useStudentAuth && token) {
      try {
        const url = params ? `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.BASE}?${new URLSearchParams(params)}` : `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.BASE}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Notifications retrieved successfully',
          data: result.data
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to get notifications');
      }
    }

    // Use httpClient for admin authentication or general fallback
    return httpClient.get<PaginatedNotificationsResponse>(API_ENDPOINTS.NOTIFICATIONS.BASE, params);
  }

  // Get unread notification count with role-based authentication
  async getUnreadCount(preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<{ unreadCount: number }>> {
    const { useStudentAuth, token, userType } = this.getCurrentUserAuth(preferredUserType);

    console.log('NotificationService.getUnreadCount - Auth context:', {
      preferredUserType,
      useStudentAuth,
      hasToken: !!token,
      userType
    });

    // Use specific authentication if we have a token
    if (useStudentAuth && token) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Unread count retrieved successfully',
          data: result.data
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to get unread count');
      }
    }

    return httpClient.get<{ unreadCount: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  }

  // Mark notification as read with role-based authentication
  async markAsRead(id: number, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<void>> {
    const { useStudentAuth, token, userType } = this.getCurrentUserAuth(preferredUserType);

    console.log('NotificationService.markAsRead - Auth context:', {
      preferredUserType,
      useStudentAuth,
      hasToken: !!token,
      userType,
      notificationId: id
    });

    // Use specific authentication if we have a token
    if (useStudentAuth && token) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id.toString())}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Notification marked as read',
          data: result.data
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to mark notification as read');
      }
    }

    return httpClient.put<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id.toString()));
  }

  // Mark all notifications as read with role-based authentication
  async markAllAsRead(preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<void>> {
    const { useStudentAuth, token, userType } = this.getCurrentUserAuth(preferredUserType);

    console.log('NotificationService.markAllAsRead - Auth context:', {
      preferredUserType,
      useStudentAuth,
      hasToken: !!token,
      userType
    });

    // Use specific authentication if we have a token
    if (useStudentAuth && token) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: result.message || 'All notifications marked as read',
          data: result.data
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to mark all notifications as read');
      }
    }

    return httpClient.put<void>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  }

  // Delete notification with role-based authentication
  async deleteNotification(id: number, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<void>> {
    const { useStudentAuth, token, userType } = this.getCurrentUserAuth(preferredUserType);

    console.log('NotificationService.deleteNotification - Auth context:', {
      preferredUserType,
      useStudentAuth,
      hasToken: !!token,
      userType,
      notificationId: id
    });

    // Use specific authentication if we have a token
    if (useStudentAuth && token) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Notification deleted successfully',
          data: result.data
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to delete notification');
      }
    }

    return httpClient.delete<void>(API_ENDPOINTS.NOTIFICATIONS.BASE + `/${id}`);
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: NotificationFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });
    
    return params;
  }

  // Get unread notifications with role-based authentication
  async getUnreadNotifications(limit?: number, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    return this.getNotifications({
      is_read: false,
      limit: limit || 20,
      sort_by: 'created_at',
      sort_order: 'DESC'
    }, preferredUserType);
  }

  // Get recent notifications with role-based authentication
  async getRecentNotifications(limit: number = 10, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    return this.getNotifications({
      limit,
      sort_by: 'created_at',
      sort_order: 'DESC'
    }, preferredUserType);
  }

  // Get notifications by type with role-based authentication
  async getNotificationsByType(typeId: number, filters?: Partial<NotificationFilters>, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    return this.getNotifications({
      notification_type_id: typeId,
      ...filters
    }, preferredUserType);
  }

  // Get announcement-related notifications
  async getAnnouncementNotifications(announcementId: number): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    // This would require backend support for filtering by related_announcement_id
    // For now, return all notifications
    return this.getNotifications({
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
  }

  // Get comment-related notifications
  async getCommentNotifications(commentId: number): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    // This would require backend support for filtering by related_comment_id
    // For now, return all notifications
    return this.getNotifications({
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
  }

  // Bulk mark notifications as read with role-based authentication
  async bulkMarkAsRead(notificationIds: number[], preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<void>> {
    // This would require a bulk endpoint in the backend
    // For now, mark each notification individually
    const promises = notificationIds.map(id => this.markAsRead(id, preferredUserType));
    await Promise.all(promises);
    return { success: true, message: 'Notifications marked as read', data: undefined };
  }

  // Bulk delete notifications with role-based authentication
  async bulkDeleteNotifications(notificationIds: number[], preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<void>> {
    // This would require a bulk endpoint in the backend
    // For now, delete each notification individually
    const promises = notificationIds.map(id => this.deleteNotification(id, preferredUserType));
    await Promise.all(promises);
    return { success: true, message: 'Notifications deleted', data: undefined };
  }

  // Get notification statistics with role-based authentication
  async getNotificationStatistics(preferredUserType?: 'admin' | 'student'): Promise<{
    total: number;
    unread: number;
    today: number;
    thisWeek: number;
  }> {
    try {
      const [unreadResponse, allResponse] = await Promise.all([
        this.getUnreadCount(preferredUserType),
        this.getNotifications({ limit: 1 }, preferredUserType)
      ]);

      return {
        total: allResponse.data?.pagination.total || 0,
        unread: unreadResponse.data?.unreadCount || 0,
        today: 0, // Would need backend support
        thisWeek: 0 // Would need backend support
      };
    } catch (error) {
      return {
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0
      };
    }
  }

  // Check for new notifications (polling) with role-based authentication
  async checkForNewNotifications(lastCheckTime?: string, preferredUserType?: 'admin' | 'student'): Promise<{
    hasNew: boolean;
    count: number;
    notifications: Notification[];
  }> {
    try {
      const response = await this.getUnreadNotifications(10, preferredUserType);
      const notifications = response.data?.notifications || [];

      let newNotifications = notifications;
      if (lastCheckTime) {
        newNotifications = notifications.filter(
          notification => new Date(notification.created_at) > new Date(lastCheckTime)
        );
      }

      return {
        hasNew: newNotifications.length > 0,
        count: newNotifications.length,
        notifications: newNotifications
      };
    } catch (error) {
      return {
        hasNew: false,
        count: 0,
        notifications: []
      };
    }
  }

  // Format notification for display
  formatNotification(notification: Notification): {
    title: string;
    message: string;
    timeAgo: string;
    type: string;
  } {
    return {
      title: notification.title,
      message: notification.message,
      timeAgo: this.getTimeAgo(notification.created_at),
      type: this.getNotificationType(notification.notification_type_id)
    };
  }

  // Get time ago string
  private getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Get notification type name
  private getNotificationType(typeId: number): string {
    const types: Record<number, string> = {
      1: 'announcement',
      2: 'alert',
      3: 'comment',
      4: 'reaction',
      5: 'system',
      6: 'reminder'
    };
    return types[typeId] || 'notification';
  }

  // Subscribe to real-time notifications (WebSocket)
  subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    // This would implement WebSocket connection for real-time notifications
    // For now, return a dummy unsubscribe function
    console.log('Notification subscription would be implemented here');
    
    return () => {
      console.log('Unsubscribing from notifications');
    };
  }
}

// Role-specific notification service classes
class AdminNotificationService extends NotificationService {
  constructor() {
    super();
  }

  async getNotifications(filters?: NotificationFilters): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 AdminNotificationService - Getting notifications as admin');
    return super.getNotifications(filters, 'admin');
  }

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    console.log('🔧 AdminNotificationService - Getting unread count as admin');
    return super.getUnreadCount('admin');
  }

  async markAsRead(id: number): Promise<ApiResponse<void>> {
    console.log('🔧 AdminNotificationService - Marking notification as read as admin');
    return super.markAsRead(id, 'admin');
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    console.log('🔧 AdminNotificationService - Marking all notifications as read as admin');
    return super.markAllAsRead('admin');
  }

  async deleteNotification(id: number): Promise<ApiResponse<void>> {
    console.log('🔧 AdminNotificationService - Deleting notification as admin');
    return super.deleteNotification(id, 'admin');
  }

  async getUnreadNotifications(limit?: number): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 AdminNotificationService - Getting unread notifications as admin');
    return super.getUnreadNotifications(limit, 'admin');
  }

  async getRecentNotifications(limit: number = 10): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 AdminNotificationService - Getting recent notifications as admin');
    return super.getRecentNotifications(limit, 'admin');
  }

  async getNotificationsByType(typeId: number, filters?: Partial<NotificationFilters>): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 AdminNotificationService - Getting notifications by type as admin');
    return super.getNotificationsByType(typeId, filters, 'admin');
  }

  async getNotificationStatistics(): Promise<{ total: number; unread: number; today: number; thisWeek: number; }> {
    console.log('🔧 AdminNotificationService - Getting notification statistics as admin');
    return super.getNotificationStatistics('admin');
  }

  async checkForNewNotifications(lastCheckTime?: string): Promise<{ hasNew: boolean; count: number; notifications: Notification[]; }> {
    console.log('🔧 AdminNotificationService - Checking for new notifications as admin');
    return super.checkForNewNotifications(lastCheckTime, 'admin');
  }

  async bulkMarkAsRead(notificationIds: number[]): Promise<ApiResponse<void>> {
    console.log('🔧 AdminNotificationService - Bulk marking notifications as read as admin');
    return super.bulkMarkAsRead(notificationIds, 'admin');
  }

  async bulkDeleteNotifications(notificationIds: number[]): Promise<ApiResponse<void>> {
    console.log('🔧 AdminNotificationService - Bulk deleting notifications as admin');
    return super.bulkDeleteNotifications(notificationIds, 'admin');
  }
}

class StudentNotificationService extends NotificationService {
  constructor() {
    super();
  }

  async getNotifications(filters?: NotificationFilters): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 StudentNotificationService - Getting notifications as student');
    return super.getNotifications(filters, 'student');
  }

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    console.log('🔧 StudentNotificationService - Getting unread count as student');
    return super.getUnreadCount('student');
  }

  async markAsRead(id: number): Promise<ApiResponse<void>> {
    console.log('🔧 StudentNotificationService - Marking notification as read as student');
    return super.markAsRead(id, 'student');
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    console.log('🔧 StudentNotificationService - Marking all notifications as read as student');
    return super.markAllAsRead('student');
  }

  async deleteNotification(id: number): Promise<ApiResponse<void>> {
    console.log('🔧 StudentNotificationService - Deleting notification as student');
    return super.deleteNotification(id, 'student');
  }

  async getUnreadNotifications(limit?: number): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 StudentNotificationService - Getting unread notifications as student');
    return super.getUnreadNotifications(limit, 'student');
  }

  async getRecentNotifications(limit: number = 10): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 StudentNotificationService - Getting recent notifications as student');
    return super.getRecentNotifications(limit, 'student');
  }

  async getNotificationsByType(typeId: number, filters?: Partial<NotificationFilters>): Promise<ApiResponse<PaginatedNotificationsResponse>> {
    console.log('🔧 StudentNotificationService - Getting notifications by type as student');
    return super.getNotificationsByType(typeId, filters, 'student');
  }

  async getNotificationStatistics(): Promise<{ total: number; unread: number; today: number; thisWeek: number; }> {
    console.log('🔧 StudentNotificationService - Getting notification statistics as student');
    return super.getNotificationStatistics('student');
  }

  async checkForNewNotifications(lastCheckTime?: string): Promise<{ hasNew: boolean; count: number; notifications: Notification[]; }> {
    console.log('🔧 StudentNotificationService - Checking for new notifications as student');
    return super.checkForNewNotifications(lastCheckTime, 'student');
  }

  async bulkMarkAsRead(notificationIds: number[]): Promise<ApiResponse<void>> {
    console.log('🔧 StudentNotificationService - Bulk marking notifications as read as student');
    return super.bulkMarkAsRead(notificationIds, 'student');
  }

  async bulkDeleteNotifications(notificationIds: number[]): Promise<ApiResponse<void>> {
    console.log('🔧 StudentNotificationService - Bulk deleting notifications as student');
    return super.bulkDeleteNotifications(notificationIds, 'student');
  }
}

export const notificationService = new NotificationService();
export const adminNotificationService = new AdminNotificationService();
export const studentNotificationService = new StudentNotificationService();
export default notificationService;
