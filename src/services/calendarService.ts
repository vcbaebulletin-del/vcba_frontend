import { httpClient } from './api.service';
import { AdminAuthService } from './admin-auth.service';
import { API_ENDPOINTS, API_BASE_URL } from '../config/constants';
import { ApiResponse } from '../types';

// Types for calendar
export interface CalendarEvent {
  calendar_id: number;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  category_id?: number;
  subcategory_id?: number;
  category_name?: string;
  category_color?: string;
  subcategory_name?: string;
  subcategory_color?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly';
  is_active: boolean;
  allow_comments: boolean;
  is_alert: boolean;
  is_holiday?: boolean;
  created_by: number;
  created_by_name?: string;
  created_by_picture?: string;
  created_at: string;
  updated_at: string;

  // Reaction and comment counts
  reaction_count?: number;
  comment_count?: number;
  user_has_reacted?: boolean;

  // Multi-day event properties (added by backend for calendar view)
  isMultiDay?: boolean;
  isEventStart?: boolean;
  isEventEnd?: boolean;
  originalStartDate?: string;
  originalEndDate?: string;

  // Recurring event properties (added by backend for recurring instances)
  is_recurring_instance?: boolean;
  original_event_id?: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  category_id: number;
  subcategory_id?: number | null;
  is_recurring?: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly';
  is_active?: boolean;
  allow_comments?: boolean;
  is_alert?: boolean;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  event_date?: string;
  end_date?: string;
  category_id?: number;
  subcategory_id?: number | null;
  is_recurring?: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly';
  is_active?: boolean;
  allow_comments?: boolean;
  is_alert?: boolean;
}

export interface EventFilters {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  category_id?: number;
  subcategory_id?: number;
  is_active?: boolean;
  is_recurring?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}



export interface PaginatedEventsResponse {
  events: CalendarEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CalendarViewResponse {
  events: Record<string, CalendarEvent[]>; // Grouped by date (YYYY-MM-DD)
}

class CalendarService {
  // Helper method to determine which HTTP client to use based on user type
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    // Check if user is admin (has admin token) - check both admin-specific and general auth
    const isAdminAuth = AdminAuthService.isAuthenticated();
    const hasGeneralToken = localStorage.getItem('vcba_auth_token');
    const generalUserData = localStorage.getItem('vcba_user_data');

    // Check if general auth user is admin
    let isGeneralAdmin = false;
    if (hasGeneralToken && generalUserData) {
      try {
        const userData = JSON.parse(generalUserData);
        isGeneralAdmin = userData.role === 'admin';
      } catch (e) {
        // Ignore parsing errors
      }
    }

    const isAdmin = isAdminAuth || isGeneralAdmin;

    if (isAdmin) {
      // For admin requests, prefer AdminAuthService if available, otherwise use httpClient with admin token
      if (isAdminAuth) {
        // Use AdminAuthService for admin requests
        const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;

        switch (method) {
          case 'GET':
            return AdminAuthService.request<T>('GET', url);
          case 'POST':
            return AdminAuthService.request<T>('POST', endpoint, data);
          case 'PUT':
            return AdminAuthService.request<T>('PUT', endpoint, data);
          case 'DELETE':
            return AdminAuthService.request<T>('DELETE', endpoint);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      } else {
        // Use regular httpClient with general admin token
        const urlWithParams = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;

        switch (method) {
          case 'GET':
            return httpClient.get<T>(urlWithParams);
          case 'POST':
            return httpClient.post<T>(endpoint, data);
          case 'PUT':
            return httpClient.put<T>(endpoint, data);
          case 'DELETE':
            return httpClient.delete<T>(endpoint);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      }
    } else {
      // Use regular httpClient for student/public requests
      const urlWithParams = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;

      switch (method) {
        case 'GET':
          return httpClient.get<T>(urlWithParams);
        case 'POST':
          return httpClient.post<T>(endpoint, data);
        case 'PUT':
          return httpClient.put<T>(endpoint, data);
        case 'DELETE':
          return httpClient.delete<T>(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    }
  }

  // Get calendar events with filters and pagination
  async getEvents(filters?: EventFilters): Promise<ApiResponse<PaginatedEventsResponse>> {
    const params = filters ? this.buildQueryParams(filters) : undefined;
    return this.makeRequest<PaginatedEventsResponse>('GET', API_ENDPOINTS.CALENDAR.BASE, undefined, params);
  }

  // Get single event by ID
  async getEventById(id: number): Promise<ApiResponse<{ event: CalendarEvent }>> {
    return this.makeRequest<{ event: CalendarEvent }>('GET', API_ENDPOINTS.CALENDAR.BY_ID(id.toString()));
  }

  // Create new event
  async createEvent(data: CreateEventData): Promise<ApiResponse<{ event: CalendarEvent }>> {
    return this.makeRequest<{ event: CalendarEvent }>('POST', API_ENDPOINTS.CALENDAR.BASE, data);
  }

  // Update event
  async updateEvent(id: number, data: UpdateEventData): Promise<ApiResponse<{ event: CalendarEvent }>> {
    return this.makeRequest<{ event: CalendarEvent }>('PUT', API_ENDPOINTS.CALENDAR.BY_ID(id.toString()), data);
  }

  // Delete event
  async deleteEvent(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('DELETE', API_ENDPOINTS.CALENDAR.BY_ID(id.toString()));
  }

  // Get calendar view (month/year)
  async getCalendarView(year: number, month?: number): Promise<ApiResponse<CalendarViewResponse>> {
    const params: Record<string, string> = { year: year.toString() };
    if (month) {
      params.month = month.toString();
    }
    return this.makeRequest<CalendarViewResponse>('GET', API_ENDPOINTS.CALENDAR.VIEW, undefined, params);
  }

  // Get current month events
  async getCurrentMonthEvents(): Promise<ApiResponse<CalendarViewResponse & { year: number; month: number }>> {
    return this.makeRequest<CalendarViewResponse & { year: number; month: number }>('GET', API_ENDPOINTS.CALENDAR.CURRENT_MONTH);
  }

  // Get upcoming events
  async getUpcomingEvents(limit?: number): Promise<ApiResponse<{ events: CalendarEvent[] }>> {
    const params = limit ? { limit: limit.toString() } : undefined;
    return this.makeRequest<{ events: CalendarEvent[] }>('GET', API_ENDPOINTS.CALENDAR.UPCOMING, undefined, params);
  }

  // Get events by date
  async getEventsByDate(date: string): Promise<ApiResponse<{ events: CalendarEvent[] }>> {
    return this.makeRequest<{ events: CalendarEvent[] }>('GET', API_ENDPOINTS.CALENDAR.BY_DATE(date));
  }

  // Get events by date range
  async getEventsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<{ events: CalendarEvent[] }>> {
    const params = { start_date: startDate, end_date: endDate };
    return this.makeRequest<{ events: CalendarEvent[] }>('GET', API_ENDPOINTS.CALENDAR.DATE_RANGE, undefined, params);
  }



  // Helper method to build query parameters
  private buildQueryParams(filters: EventFilters): Record<string, string> {
    const params: Record<string, string> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });
    
    return params;
  }

  // Get events for a specific month
  async getMonthEvents(year: number, month: number): Promise<ApiResponse<CalendarViewResponse>> {
    return this.getCalendarView(year, month);
  }

  // Get events for a specific year
  async getYearEvents(year: number): Promise<ApiResponse<CalendarViewResponse>> {
    return this.getCalendarView(year);
  }

  // Get today's events
  async getTodayEvents(): Promise<ApiResponse<{ events: CalendarEvent[] }>> {
    // Format today's date manually to avoid timezone issues
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return this.getEventsByDate(todayStr);
  }

  // Get this week's events
  async getWeekEvents(startDate?: string): Promise<ApiResponse<{ events: CalendarEvent[] }>> {
    const start = startDate || this.getWeekStart();
    const end = this.getWeekEnd(start);
    return this.getEventsByDateRange(start, end);
  }

  // Get events for admin dashboard
  async getAdminEvents(filters?: Partial<EventFilters>): Promise<ApiResponse<PaginatedEventsResponse>> {
    const defaultFilters: EventFilters = {
      page: 1,
      limit: 50,
      sort_by: 'event_date',
      sort_order: 'ASC',
      ...filters
    };
    return this.getEvents(defaultFilters);
  }

  // Get active events only
  async getActiveEvents(filters?: Partial<EventFilters>): Promise<ApiResponse<PaginatedEventsResponse>> {
    return this.getEvents({
      is_active: true,
      ...filters
    });
  }

  // Search events
  async searchEvents(query: string, filters?: Partial<EventFilters>): Promise<ApiResponse<PaginatedEventsResponse>> {
    return this.getEvents({
      search: query,
      is_active: true,
      ...filters
    });
  }

  // Get recurring events
  async getRecurringEvents(): Promise<ApiResponse<PaginatedEventsResponse>> {
    return this.getEvents({
      is_recurring: true,
      is_active: true,
      sort_by: 'event_date',
      sort_order: 'ASC'
    });
  }

  // Get events by category
  async getEventsByCategory(categoryId: number): Promise<ApiResponse<PaginatedEventsResponse>> {
    return this.getEvents({
      category_id: categoryId,
      is_active: true,
      sort_by: 'event_date',
      sort_order: 'ASC'
    });
  }



  // Utility methods for date calculations
  private getWeekStart(date?: string): string {
    const d = date ? new Date(date) : new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  private getWeekEnd(startDate: string): string {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toISOString().split('T')[0];
  }

  // Get month boundaries
  getMonthBoundaries(year: number, month: number): { start: string; end: string } {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  // Format date for display
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  // Check if date is today
  isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }

  // Check if date is in the past
  isPast(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date < today;
  }

  // Check if date is in the future
  isFuture(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date > today;
  }

  // Get categories with subcategories for calendar events
  async getCategoriesWithSubcategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.makeRequest<{ categories: any[] }>('GET', `${API_ENDPOINTS.CALENDAR.BASE}/categories/with-subcategories`);
  }

  // Get active categories with active subcategories for calendar events
  async getActiveCategoriesWithSubcategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.makeRequest<{ categories: any[] }>('GET', `${API_ENDPOINTS.CALENDAR.BASE}/categories/active/with-subcategories`);
  }

  // Calendar attachment methods
  async getEventAttachments(eventId: number): Promise<ApiResponse<{ attachments: any[] }>> {
    return this.makeRequest<{ attachments: any[] }>('GET', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/attachments`);
  }

  async uploadEventAttachments(eventId: number, formData: FormData): Promise<ApiResponse<{ attachments: any[] }>> {
    return this.makeRequest<{ attachments: any[] }>('POST', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/attachments`, formData);
  }

  async deleteEventAttachment(attachmentId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('DELETE', `${API_ENDPOINTS.CALENDAR.BASE}/attachments/${attachmentId}`);
  }

  async setPrimaryAttachment(eventId: number, attachmentId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('PUT', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/attachments/${attachmentId}/primary`);
  }

  // Event management methods
  async publishEvent(eventId: number): Promise<ApiResponse<{ event: CalendarEvent }>> {
    return this.makeRequest<{ event: CalendarEvent }>('PUT', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/publish`);
  }

  async unpublishEvent(eventId: number): Promise<ApiResponse<{ event: CalendarEvent }>> {
    return this.makeRequest<{ event: CalendarEvent }>('PUT', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/unpublish`);
  }

  async softDeleteEvent(eventId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('PUT', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/soft-delete`);
  }

  async restoreEvent(eventId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('PUT', `${API_ENDPOINTS.CALENDAR.BASE}/${eventId}/restore`);
  }
}

export const calendarService = new CalendarService();
export default calendarService;
