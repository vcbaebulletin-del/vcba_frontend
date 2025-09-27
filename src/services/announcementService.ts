import { httpClient, adminHttpClient, studentHttpClient } from './api.service';
import { AdminAuthService } from './admin-auth.service';
import { API_ENDPOINTS } from '../config/constants';
import { ApiResponse } from '../types';

// Types for announcements
export interface Announcement {
  announcement_id: number;
  title: string;
  content: string;
  image_path?: string;
  image_url?: string;
  category_id: number;
  subcategory_id?: number;
  category_name?: string;
  category_color?: string;
  subcategory_name?: string;
  subcategory_color?: string;
  posted_by: number;
  grade_level?: number;
  author_name?: string;
  author_picture?: string;
  status: 'draft' | 'pending' | 'scheduled' | 'published' | 'archived';
  is_pinned: boolean;
  is_alert: boolean;
  allow_comments: boolean;
  allow_sharing: boolean;
  scheduled_publish_at?: string;
  visibility_start_at?: string;
  visibility_end_at?: string;
  published_at?: string;
  archived_at?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  view_count: number;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_reaction?: UserReaction;
  reactions?: ReactionSummary[];
  // Multiple image support
  attachments?: AnnouncementAttachment[];
  images?: AnnouncementAttachment[];
}

export interface AnnouncementAttachment {
  attachment_id: number;
  announcement_id: number;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: 'image' | 'document';
  file_size: number;
  mime_type: string;
  display_order: number;
  is_primary: boolean;
  uploaded_at: string;
  deleted_at?: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  category_id: number;
  subcategory_id?: number;
  grade_level?: number;
  status?: 'draft' | 'scheduled' | 'published';
  is_pinned?: boolean;
  is_alert?: boolean;
  allow_comments?: boolean;
  allow_sharing?: boolean;
  scheduled_publish_at?: string;
  visibility_start_at?: string;
  visibility_end_at?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  category_id?: number;
  subcategory_id?: number;
  grade_level?: number;
  status?: 'draft' | 'scheduled' | 'published' | 'archived';
  is_pinned?: boolean;
  is_alert?: boolean;
  allow_comments?: boolean;
  allow_sharing?: boolean;
  scheduled_publish_at?: string;
  visibility_start_at?: string;
  visibility_end_at?: string;
}

export interface AnnouncementFilters {
  page?: number;
  limit?: number;
  status?: string;
  category_id?: number;
  subcategory_id?: number;
  posted_by?: number;
  grade_level?: number;
  is_pinned?: boolean;
  is_alert?: boolean;
  search?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface Category {
  category_id: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  subcategory_id: number;
  category_id: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_color?: string;
}

export interface ReactionType {
  reaction_id: number;
  reaction_name: string;
  reaction_emoji: string;
  is_active: boolean;
}

export interface UserReaction {
  reaction_id: number;
  reaction_name: string;
  reaction_emoji: string;
}

export interface ReactionSummary {
  reaction_id: number;
  reaction_name: string;
  reaction_emoji: string;
  count: number;
}

export interface PaginatedResponse<T> {
  announcements: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class AnnouncementService {
  private client: typeof httpClient; // HTTP client instance

  constructor(customHttpClient?: typeof httpClient) {
    this.client = customHttpClient || httpClient; // Use custom client or default
  }
  // Get all announcements with filters and pagination
  async getAnnouncements(filters?: AnnouncementFilters): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    const params = filters ? this.buildQueryParams(filters) : undefined;
    return this.client.get(API_ENDPOINTS.ANNOUNCEMENTS.BASE, params);
  }

  // Get featured announcements
  async getFeaturedAnnouncements(limit?: number): Promise<ApiResponse<{ announcements: Announcement[] }>> {
    const params = limit ? { limit } : undefined;
    return this.client.get(API_ENDPOINTS.ANNOUNCEMENTS.FEATURED, params);
  }

  // Get single announcement by ID
  async getAnnouncementById(id: number): Promise<ApiResponse<{ announcement: Announcement }>> {
    return this.client.get(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id.toString()));
  }

  // Create new announcement
  async createAnnouncement(data: CreateAnnouncementData): Promise<ApiResponse<{ announcement: Announcement }>> {
    return httpClient.post<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.BASE, data);
  }

  // Update announcement
  async updateAnnouncement(id: number, data: UpdateAnnouncementData): Promise<ApiResponse<{ announcement: Announcement }>> {
    return httpClient.put<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id.toString()), data);
  }

  // Delete announcement
  async deleteAnnouncement(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id.toString()));
  }

  // Publish announcement
  async publishAnnouncement(id: number): Promise<ApiResponse<{ announcement: Announcement }>> {
    return httpClient.post<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.PUBLISH(id.toString()));
  }

  // Unpublish announcement
  async unpublishAnnouncement(id: number): Promise<ApiResponse<{ announcement: Announcement }>> {
    return httpClient.post<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.UNPUBLISH(id.toString()));
  }

  // Mark announcement as viewed
  async markAsViewed(id: number): Promise<ApiResponse<void>> {
    return httpClient.post<void>(API_ENDPOINTS.ANNOUNCEMENTS.VIEW(id.toString()));
  }

  // Add reaction to announcement
  async addReaction(id: number, reactionId: number): Promise<ApiResponse<void>> {
    console.log('❤️ AnnouncementService - Adding reaction:', {
      announcementId: id,
      reactionId,
      clientType: this.client === adminHttpClient ? 'ADMIN' : this.client === studentHttpClient ? 'STUDENT' : 'DEFAULT'
    });
    return this.client.post(API_ENDPOINTS.ANNOUNCEMENTS.LIKE(id.toString()), { reaction_id: reactionId });
  }

  // Remove reaction from announcement
  async removeReaction(id: number): Promise<ApiResponse<{ removed: boolean }>> {
    console.log('💔 AnnouncementService - Removing reaction:', {
      announcementId: id,
      clientType: this.client === adminHttpClient ? 'ADMIN' : this.client === studentHttpClient ? 'STUDENT' : 'DEFAULT'
    });
    return this.client.delete(API_ENDPOINTS.ANNOUNCEMENTS.LIKE(id.toString()));
  }

  // Get announcement reaction statistics
  async getReactionStats(id?: number): Promise<ApiResponse<{ stats: ReactionSummary[] }>> {
    const endpoint = id 
      ? API_ENDPOINTS.ANNOUNCEMENTS.REACTIONS(id.toString())
      : API_ENDPOINTS.ANNOUNCEMENTS.REACTION_TYPES;
    return httpClient.get<{ stats: ReactionSummary[] }>(endpoint);
  }

  // Get categories (public endpoint)
  async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return httpClient.getPublic<{ categories: Category[] }>(API_ENDPOINTS.ANNOUNCEMENTS.CATEGORIES);
  }

  // Get all subcategories (public endpoint)
  async getSubcategories(): Promise<ApiResponse<{ subcategories: Subcategory[] }>> {
    return httpClient.getPublic<{ subcategories: Subcategory[] }>(API_ENDPOINTS.ANNOUNCEMENTS.SUBCATEGORIES);
  }

  // Get subcategories by category ID (public endpoint)
  async getSubcategoriesByCategory(categoryId: number): Promise<ApiResponse<{ subcategories: Subcategory[] }>> {
    return httpClient.getPublic<{ subcategories: Subcategory[] }>(API_ENDPOINTS.ANNOUNCEMENTS.SUBCATEGORIES_BY_CATEGORY(categoryId.toString()));
  }

  // Get categories with their subcategories (hierarchical structure) (public endpoint)
  async getCategoriesWithSubcategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return httpClient.getPublic<{ categories: Category[] }>(API_ENDPOINTS.ANNOUNCEMENTS.CATEGORIES_WITH_SUBCATEGORIES);
  }

  // Get reaction types
  async getReactionTypes(): Promise<ApiResponse<{ reactionTypes: ReactionType[] }>> {
    return httpClient.get<{ reactionTypes: ReactionType[] }>(API_ENDPOINTS.ANNOUNCEMENTS.REACTION_TYPES);
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: AnnouncementFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });
    
    return params;
  }

  // Get announcements for admin dashboard
  async getAdminAnnouncements(filters?: Partial<AnnouncementFilters>): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    const defaultFilters: AnnouncementFilters = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC',
      ...filters
    };
    return this.getAnnouncements(defaultFilters);
  }

  // Get published announcements for students
  async getPublishedAnnouncements(filters?: Partial<AnnouncementFilters>): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    const defaultFilters: AnnouncementFilters = {
      page: 1,
      limit: 20,
      status: 'published',
      sort_by: 'created_at',
      sort_order: 'DESC',
      ...filters
    };
    return this.getAnnouncements(defaultFilters);
  }

  // Get pinned announcements
  async getPinnedAnnouncements(): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    return this.getAnnouncements({
      is_pinned: true,
      status: 'published',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
  }

  // Get alert announcements
  async getAlertAnnouncements(): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    return this.getAnnouncements({
      is_alert: true,
      status: 'published',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
  }

  // Search announcements
  async searchAnnouncements(query: string, filters?: Partial<AnnouncementFilters>): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    return this.getAnnouncements({
      search: query,
      status: 'published',
      ...filters
    });
  }
}

// Admin-specific announcement service that uses admin authentication
class AdminAnnouncementService {
  // Get all announcements with admin auth
  async getAnnouncements(filters?: AnnouncementFilters): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    const params = filters ? this.buildQueryParams(filters) : '';
    const endpoint = `${API_ENDPOINTS.ANNOUNCEMENTS.BASE}${params}`;
    return AdminAuthService.get<PaginatedResponse<Announcement>>(endpoint);
  }

  // Create new announcement with admin auth
  async createAnnouncement(data: CreateAnnouncementData | FormData): Promise<ApiResponse<{ announcement: Announcement }>> {
    return AdminAuthService.post<{ announcement: Announcement }>(
      API_ENDPOINTS.ANNOUNCEMENTS.BASE,
      data
    );
  }

  // Update announcement with admin auth
  async updateAnnouncement(id: number, data: UpdateAnnouncementData | FormData): Promise<ApiResponse<{ announcement: Announcement }>> {
    return AdminAuthService.put<{ announcement: Announcement }>(
      API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id.toString()),
      data
    );
  }

  // Delete announcement with admin auth
  async deleteAnnouncement(id: number): Promise<ApiResponse<void>> {
    return AdminAuthService.delete<void>(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id.toString()));
  }

  // Publish announcement with admin auth
  async publishAnnouncement(id: number): Promise<ApiResponse<{ announcement: Announcement }>> {
    return AdminAuthService.post<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.PUBLISH(id.toString()));
  }

  // Unpublish announcement with admin auth
  async unpublishAnnouncement(id: number): Promise<ApiResponse<{ announcement: Announcement }>> {
    return AdminAuthService.post<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.UNPUBLISH(id.toString()));
  }

  // Get single announcement by ID with admin auth
  async getAnnouncementById(id: number): Promise<ApiResponse<{ announcement: Announcement }>> {
    return AdminAuthService.get<{ announcement: Announcement }>(API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(id.toString()));
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: AnnouncementFilters): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return params.toString() ? `?${params.toString()}` : '';
  }

  // Get announcements for admin dashboard with admin auth
  async getAdminAnnouncements(filters?: Partial<AnnouncementFilters>): Promise<ApiResponse<PaginatedResponse<Announcement>>> {
    const defaultFilters: AnnouncementFilters = {
      page: 1,
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'DESC',
      ...filters
    };
    return this.getAnnouncements(defaultFilters);
  }

  // Get categories with admin auth
  async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return AdminAuthService.get<{ categories: Category[] }>(API_ENDPOINTS.ANNOUNCEMENTS.CATEGORIES);
  }

  // Get all subcategories with admin auth
  async getSubcategories(): Promise<ApiResponse<{ subcategories: Subcategory[] }>> {
    return AdminAuthService.get<{ subcategories: Subcategory[] }>(API_ENDPOINTS.ANNOUNCEMENTS.SUBCATEGORIES);
  }

  // Get subcategories by category ID with admin auth
  async getSubcategoriesByCategory(categoryId: number): Promise<ApiResponse<{ subcategories: Subcategory[] }>> {
    return AdminAuthService.get<{ subcategories: Subcategory[] }>(API_ENDPOINTS.ANNOUNCEMENTS.SUBCATEGORIES_BY_CATEGORY(categoryId.toString()));
  }

  // Get categories with their subcategories (hierarchical structure) with admin auth
  async getCategoriesWithSubcategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return AdminAuthService.get<{ categories: Category[] }>(API_ENDPOINTS.ANNOUNCEMENTS.CATEGORIES_WITH_SUBCATEGORIES);
  }

  // Multiple image management methods

  // Add multiple images to announcement
  async addAnnouncementImages(announcementId: number, formData: FormData): Promise<ApiResponse<any>> {
    return AdminAuthService.post<any>(
      `${API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(announcementId.toString())}/images`,
      formData
    );
  }

  // Get all images for announcement
  async getAnnouncementImages(announcementId: number): Promise<ApiResponse<{ images: any[] }>> {
    return AdminAuthService.get<{ images: any[] }>(
      `${API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(announcementId.toString())}/images`
    );
  }

  // Delete specific image from announcement
  async deleteAnnouncementImage(announcementId: number, attachmentId: number): Promise<ApiResponse<void>> {
    return AdminAuthService.delete<void>(
      `${API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(announcementId.toString())}/images/${attachmentId}`
    );
  }

  // Update image display order
  async updateImageOrder(announcementId: number, imageOrder: { attachment_id: number; display_order: number }[]): Promise<ApiResponse<void>> {
    return AdminAuthService.put<void>(
      `${API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(announcementId.toString())}/images/order`,
      { imageOrder }
    );
  }

  // Set primary image for announcement
  async setPrimaryImage(announcementId: number, attachmentId: number): Promise<ApiResponse<void>> {
    return AdminAuthService.put<void>(
      `${API_ENDPOINTS.ANNOUNCEMENTS.BY_ID(announcementId.toString())}/images/${attachmentId}/primary`,
      {}
    );
  }

  // Add reaction to announcement (admin)
  async addReaction(announcementId: number, reactionId: number): Promise<ApiResponse<void>> {
    return AdminAuthService.post<void>(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/like`, {
      reaction_id: reactionId
    });
  }

  // Remove reaction from announcement (admin)
  async removeReaction(announcementId: number): Promise<ApiResponse<void>> {
    return AdminAuthService.delete<void>(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/like`);
  }

  // Approval workflow methods
  async submitForApproval(announcementId: number): Promise<ApiResponse<void>> {
    return AdminAuthService.patch<void>(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/submit-approval`);
  }

  async approveAnnouncement(announcementId: number): Promise<ApiResponse<void>> {
    return AdminAuthService.patch<void>(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/approve`);
  }

  async rejectAnnouncement(announcementId: number, reason?: string): Promise<ApiResponse<void>> {
    return AdminAuthService.patch<void>(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}/${announcementId}/reject`, {});
  }

  async getPendingAnnouncements(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{
    announcements: Announcement[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    queryParams.append('status', 'pending'); // Only get pending announcements

    return AdminAuthService.get<{
      announcements: Announcement[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      };
    }>(`${API_ENDPOINTS.ANNOUNCEMENTS.BASE}?${queryParams.toString()}`);
  }
}

// Export service instances
export const announcementService = new AnnouncementService(); // Default/legacy service
export const adminAnnouncementService = new AdminAnnouncementService();

// Role-specific announcement services with proper token management
export const adminAnnouncementServiceWithToken = new AnnouncementService(adminHttpClient);
export const studentAnnouncementServiceWithToken = new AnnouncementService(studentHttpClient);

export default announcementService;
