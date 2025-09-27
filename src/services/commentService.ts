import { httpClient, adminHttpClient, studentHttpClient } from './api.service';
import { API_ENDPOINTS, STUDENT_AUTH_TOKEN_KEY, ADMIN_AUTH_TOKEN_KEY, ADMIN_USER_DATA_KEY, STUDENT_USER_DATA_KEY, API_BASE_URL } from '../config/constants';
import { ApiResponse } from '../types';
import { ReactionSummary, ReactionType, UserReaction } from './announcementService';

// Types for comments
export interface Comment {
  comment_id: number;
  announcement_id?: number;
  calendar_id?: number;
  parent_comment_id?: number;
  user_type: 'admin' | 'student';
  user_id: number;
  comment_text: string;
  is_anonymous: boolean;
  is_flagged: boolean;
  flagged_by?: number;
  flagged_reason?: string;
  flagged_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_picture?: string;
  reaction_count: number;
  user_reaction?: UserReaction;
  reactions?: ReactionSummary[];
  replies?: Comment[];
}

export interface CreateCommentData {
  announcement_id?: number;
  calendar_id?: number;
  parent_comment_id?: number;
  comment_text: string;
  is_anonymous?: boolean;
}

export interface UpdateCommentData {
  comment_text: string;
}

export interface CommentFilters {
  announcement_id?: number;
  calendar_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface FlaggedCommentFilters {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedCommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class CommentService {
  private client: typeof httpClient; // HTTP client instance

  constructor(customHttpClient?: typeof httpClient) {
    this.client = customHttpClient || httpClient; // Use custom client or default
  }
  // Determine which authentication method to use based on current user context
  private getCurrentUserAuth(preferredUserType?: 'admin' | 'student'): { useStudentAuth: boolean; token: string | null; userType: 'admin' | 'student' | null } {
    const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    const adminUser = localStorage.getItem(ADMIN_USER_DATA_KEY);
    const studentToken = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);
    const studentUser = localStorage.getItem(STUDENT_USER_DATA_KEY);

    // If a preferred user type is specified, use that context first
    if (preferredUserType === 'admin' && adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        if (userData.role === 'admin') {
          console.log('🔑 CommentService - Using admin authentication (preferred)');
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
          console.log('🔑 CommentService - Using student authentication (preferred)');
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
          console.log('🔑 CommentService - Using admin authentication (admin page context)');
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
          console.log('🔑 CommentService - Using student authentication (student page context)');
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
          console.log('🔑 CommentService - Using student authentication (fallback)');
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
          console.log('🔑 CommentService - Using admin authentication (fallback)');
          return { useStudentAuth: false, token: adminToken, userType: 'admin' };
        }
      } catch (e) {
        console.warn('Failed to parse admin user data');
      }
    }

    // Last resort: check tokens without user data validation (prioritize student)
    if (studentToken) {
      console.log('🔑 CommentService - Using student token (no user data)');
      return { useStudentAuth: true, token: studentToken, userType: 'student' };
    }

    if (adminToken) {
      console.log('🔑 CommentService - Using admin token (no user data)');
      return { useStudentAuth: false, token: adminToken, userType: 'admin' };
    }

    // No authentication available
    console.log('🔑 CommentService - No authentication available');
    return { useStudentAuth: false, token: null, userType: null };
  }

  // Get comments for an announcement
  async getComments(filters: CommentFilters): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const params = this.buildQueryParams(filters);
    return httpClient.get<PaginatedCommentsResponse>(API_ENDPOINTS.COMMENTS.BASE, params);
  }

  // Get comments by announcement ID
  async getCommentsByAnnouncement(
    announcementId: number,
    options?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'ASC' | 'DESC' }
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const filters: CommentFilters = {
      announcement_id: announcementId,
      page: options?.page || 1,
      limit: options?.limit || 20,
      sort_by: options?.sort_by || 'created_at',
      sort_order: options?.sort_order || 'ASC'
    };
    return this.getComments(filters);
  }

  // Get comments by calendar event ID
  async getCommentsByCalendar(
    calendarId: number,
    options?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'ASC' | 'DESC' }
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const params = new URLSearchParams({
      page: (options?.page || 1).toString(),
      limit: (options?.limit || 20).toString(),
      sort_by: options?.sort_by || 'created_at',
      sort_order: options?.sort_order || 'ASC'
    });

    return httpClient.get<PaginatedCommentsResponse>(`/api/comments/calendar/${calendarId}?${params}`);
  }

  // Get single comment by ID
  async getCommentById(id: number): Promise<ApiResponse<{ comment: Comment }>> {
    return httpClient.get<{ comment: Comment }>(API_ENDPOINTS.COMMENTS.BY_ID(id.toString()));
  }

  // Create new comment with optional user type preference
  async createComment(data: CreateCommentData, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<{ comment: Comment }>> {
    const { useStudentAuth, token, userType } = this.getCurrentUserAuth(preferredUserType);

    // Debug logging for anonymous comment functionality
    console.log('🔍 CommentService.createComment - Data received:', {
      is_anonymous: data.is_anonymous,
      is_anonymous_type: typeof data.is_anonymous,
      data,
      preferredUserType,
      useStudentAuth,
      hasToken: !!token,
      userType,
      tokenPrefix: token ? token.substring(0, 10) + '...' : null,
      isCalendarComment: !!data.calendar_id
    });

    // Use dedicated calendar comment endpoint if this is a calendar comment
    if (data.calendar_id) {
      const endpoint = `/api/comments/calendar/${data.calendar_id}`;
      const calendarCommentData = {
        parent_comment_id: data.parent_comment_id,
        comment_text: data.comment_text,
        is_anonymous: data.is_anonymous || false
      };

      if (useStudentAuth && token) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(calendarCommentData)
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Calendar comment creation failed:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          return {
            success: true,
            message: result.message || 'Calendar comment created successfully',
            data: result.data
          };
        } catch (error: any) {
          throw new Error(error.message || 'Failed to create calendar comment');
        }
      }

      // Fallback to default httpClient (admin auth) for calendar comments
      return httpClient.post<{ comment: Comment }>(endpoint, calendarCommentData);
    }

    // Regular announcement comment logic
    if (useStudentAuth && token) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.COMMENTS.BASE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          success: true,
          message: result.message || 'Comment created successfully',
          data: result.data
        };
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create comment');
      }
    }

    // Use httpClient for admin authentication or general fallback
    return httpClient.post<{ comment: Comment }>(API_ENDPOINTS.COMMENTS.BASE, data);
  }

  // Update comment
  async updateComment(id: number, data: UpdateCommentData): Promise<ApiResponse<{ comment: Comment }>> {
    return httpClient.put<{ comment: Comment }>(API_ENDPOINTS.COMMENTS.BY_ID(id.toString()), data);
  }

  // Delete comment
  async deleteComment(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(API_ENDPOINTS.COMMENTS.BY_ID(id.toString()));
  }

  // Add reaction to comment
  async addReaction(id: number, reactionId: number): Promise<ApiResponse<void>> {
    console.log('❤️ CommentService - Adding reaction:', {
      commentId: id,
      reactionId,
      clientType: this.client === adminHttpClient ? 'ADMIN' : this.client === studentHttpClient ? 'STUDENT' : 'DEFAULT'
    });
    return this.client.post(API_ENDPOINTS.COMMENTS.LIKE(id.toString()), { reaction_id: reactionId });
  }

  // Remove reaction from comment
  async removeReaction(id: number): Promise<ApiResponse<{ removed: boolean }>> {
    console.log('💔 CommentService - Removing reaction:', {
      commentId: id,
      clientType: this.client === adminHttpClient ? 'ADMIN' : this.client === studentHttpClient ? 'STUDENT' : 'DEFAULT'
    });
    return this.client.delete(API_ENDPOINTS.COMMENTS.LIKE(id.toString()));
  }

  // Flag comment
  async flagComment(id: number, reason?: string): Promise<ApiResponse<void>> {
    return httpClient.post<void>(API_ENDPOINTS.COMMENTS.FLAG(id.toString()), { reason });
  }

  // Get flagged comments (admin only)
  async getFlaggedComments(filters?: FlaggedCommentFilters): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const params = filters ? this.buildQueryParams(filters) : undefined;
    return httpClient.get<PaginatedCommentsResponse>(API_ENDPOINTS.COMMENTS.FLAGGED, params);
  }

  // Approve flagged comment (admin only)
  async approveComment(id: number): Promise<ApiResponse<void>> {
    return httpClient.post<void>(API_ENDPOINTS.COMMENTS.APPROVE(id.toString()));
  }

  // Reject flagged comment (admin only)
  async rejectComment(id: number): Promise<ApiResponse<void>> {
    return httpClient.post<void>(API_ENDPOINTS.COMMENTS.REJECT(id.toString()));
  }

  // Get comment reaction statistics
  async getReactionStats(id?: number): Promise<ApiResponse<{ stats: ReactionSummary[] }>> {
    const endpoint = id 
      ? API_ENDPOINTS.COMMENTS.REACTIONS(id.toString())
      : API_ENDPOINTS.COMMENTS.BASE + '/reactions';
    return httpClient.get<{ stats: ReactionSummary[] }>(endpoint);
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: CommentFilters | FlaggedCommentFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });
    
    return params;
  }

  // Create reply to a comment
  async createReply(parentCommentId: number, data: Omit<CreateCommentData, 'parent_comment_id'>, preferredUserType?: 'admin' | 'student'): Promise<ApiResponse<{ comment: Comment }>> {
    return this.createComment({
      ...data,
      parent_comment_id: parentCommentId
    }, preferredUserType);
  }

  // Get replies for a comment
  async getReplies(parentCommentId: number): Promise<Comment[]> {
    // This would typically be included in the parent comment response
    // but can be implemented as a separate endpoint if needed
    const response = await this.getCommentById(parentCommentId);
    return response.data?.comment.replies || [];
  }

  // Get comment count for an announcement
  async getCommentCount(announcementId: number): Promise<number> {
    const response = await this.getCommentsByAnnouncement(announcementId, { limit: 1 });
    return response.data?.pagination.total || 0;
  }

  // Get recent comments for admin dashboard
  async getRecentComments(limit: number = 10): Promise<ApiResponse<PaginatedCommentsResponse>> {
    return this.getComments({
      page: 1,
      limit,
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
  }

  // Search comments
  async searchComments(query: string, announcementId?: number): Promise<ApiResponse<PaginatedCommentsResponse>> {
    const filters: CommentFilters = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC'
    };

    if (announcementId) {
      filters.announcement_id = announcementId;
    }

    // Note: Search functionality would need to be implemented in the backend
    // For now, this returns all comments with the filters
    return this.getComments(filters);
  }

  // Get user's comments
  async getUserComments(userId: number, userType: 'admin' | 'student'): Promise<ApiResponse<PaginatedCommentsResponse>> {
    // This would require additional backend endpoint or filtering
    // For now, return all comments (would need backend implementation)
    return this.getComments({
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
  }

  // Bulk operations for admin
  async bulkApproveComments(commentIds: number[]): Promise<ApiResponse<void>> {
    // This would require a bulk endpoint in the backend
    // For now, approve each comment individually
    const promises = commentIds.map(id => this.approveComment(id));
    await Promise.all(promises);
    return { success: true, message: 'Comments approved successfully', data: undefined };
  }

  async bulkRejectComments(commentIds: number[]): Promise<ApiResponse<void>> {
    // This would require a bulk endpoint in the backend
    // For now, reject each comment individually
    const promises = commentIds.map(id => this.rejectComment(id));
    await Promise.all(promises);
    return { success: true, message: 'Comments rejected successfully', data: undefined };
  }

  // Get comment statistics
  async getCommentStatistics(): Promise<{
    total: number;
    flagged: number;
    today: number;
    thisWeek: number;
  }> {
    // This would require a statistics endpoint in the backend
    // For now, return mock data
    return {
      total: 0,
      flagged: 0,
      today: 0,
      thisWeek: 0
    };
  }
}

// Role-specific comment service classes
class AdminCommentService extends CommentService {
  constructor() {
    super(adminHttpClient);
  }

  async createComment(data: CreateCommentData): Promise<ApiResponse<{ comment: Comment }>> {
    console.log('🔧 AdminCommentService - Creating comment as admin');
    return super.createComment(data, 'admin');
  }

  async getCommentsByAnnouncement(
    announcementId: number,
    options?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'ASC' | 'DESC' }
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    console.log('🔧 AdminCommentService - Getting comments as admin');
    return super.getCommentsByAnnouncement(announcementId, options);
  }

  async getCommentsByCalendar(
    calendarId: number,
    options?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'ASC' | 'DESC' }
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    console.log('🔧 AdminCommentService - Getting calendar comments as admin');
    return super.getCommentsByCalendar(calendarId, options);
  }

  async addReaction(id: number, reactionId: number): Promise<ApiResponse<void>> {
    console.log('🔧 AdminCommentService - Adding reaction as admin');
    return super.addReaction(id, reactionId);
  }

  async removeReaction(id: number): Promise<ApiResponse<{ removed: boolean }>> {
    console.log('🔧 AdminCommentService - Removing reaction as admin');
    return super.removeReaction(id);
  }

  async createReply(parentCommentId: number, data: Omit<CreateCommentData, 'parent_comment_id'>): Promise<ApiResponse<{ comment: Comment }>> {
    console.log('🔧 AdminCommentService - Creating reply as admin');
    return super.createReply(parentCommentId, data, 'admin');
  }
}

class StudentCommentService extends CommentService {
  constructor() {
    super(studentHttpClient);
  }

  async createComment(data: CreateCommentData): Promise<ApiResponse<{ comment: Comment }>> {
    console.log('🔧 StudentCommentService - Creating comment as student');
    return super.createComment(data, 'student');
  }

  async getCommentsByAnnouncement(
    announcementId: number,
    options?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'ASC' | 'DESC' }
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    console.log('🔧 StudentCommentService - Getting comments as student');
    return super.getCommentsByAnnouncement(announcementId, options);
  }

  async getCommentsByCalendar(
    calendarId: number,
    options?: { page?: number; limit?: number; sort_by?: string; sort_order?: 'ASC' | 'DESC' }
  ): Promise<ApiResponse<PaginatedCommentsResponse>> {
    console.log('🔧 StudentCommentService - Getting calendar comments as student');
    return super.getCommentsByCalendar(calendarId, options);
  }

  async addReaction(id: number, reactionId: number): Promise<ApiResponse<void>> {
    console.log('🔧 StudentCommentService - Adding reaction as student');
    return super.addReaction(id, reactionId);
  }

  async removeReaction(id: number): Promise<ApiResponse<{ removed: boolean }>> {
    console.log('🔧 StudentCommentService - Removing reaction as student');
    return super.removeReaction(id);
  }

  async createReply(parentCommentId: number, data: Omit<CreateCommentData, 'parent_comment_id'>): Promise<ApiResponse<{ comment: Comment }>> {
    console.log('🔧 StudentCommentService - Creating reply as student');
    return super.createReply(parentCommentId, data, 'student');
  }
}

// Export service instances
export const commentService = new CommentService(); // Default/legacy service

// Role-specific comment services with proper token management and user type enforcement
export const adminCommentServiceWithToken = new AdminCommentService();
export const studentCommentServiceWithToken = new StudentCommentService();

export default commentService;
