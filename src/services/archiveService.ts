import { adminHttpClient } from './api.service';
import { API_ENDPOINTS } from '../config/constants';
import { ApiResponse } from '../types';

export interface ArchiveFilters {
  search?: string;
  category_id?: number;
  subcategory_id?: number;
  posted_by?: number;
  created_by?: number;
  grade_level?: number;
  start_date?: string;
  end_date?: string;
}

export interface ArchivePagination {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface ArchiveResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ArchivedAnnouncement {
  announcement_id: number;
  title: string;
  content: string;
  image_path?: string;
  category_id: number;
  subcategory_id?: number;
  posted_by: number;
  grade_level?: number;
  status: string;
  is_pinned: boolean;
  is_alert: boolean;
  allow_comments: boolean;
  allow_sharing: boolean;
  scheduled_publish_at?: string;
  published_at?: string;
  archived_at?: string;
  deleted_at: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_color: string;
  subcategory_name?: string;
  subcategory_color?: string;
  author_name: string;
}

export interface ArchivedCalendarEvent {
  calendar_id: number;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  event_time?: string;
  end_time?: string;
  location?: string;
  category_id: number;
  subcategory_id?: number;
  created_by: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  is_active: boolean;
  is_published: boolean;
  allow_comments: boolean;
  is_alert: boolean;
  deleted_at: string;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_color: string;
  subcategory_name?: string;
  subcategory_color?: string;
  created_by_name: string;
}

export interface ArchivedStudent {
  student_id: number;
  email: string;
  student_number: string;
  is_active: boolean;
  last_login?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  profile?: {
    profile_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    full_name: string;
    phone_number: string;
    grade_level: number;
    parent_guardian_name?: string;
    parent_guardian_phone?: string;
    address?: string;
    profile_picture?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface ArchiveStatistics {
  announcements: number;
  calendar_events: number;
  students: number;
  admins: number;
  total: number;
}

class ArchiveService {
  // Get archived announcements
  async getArchivedAnnouncements(
    filters: ArchiveFilters = {},
    pagination: ArchivePagination = {}
  ): Promise<ApiResponse<ArchiveResponse<ArchivedAnnouncement>>> {
    const params: Record<string, any> = {};

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    // Add pagination
    Object.entries(pagination).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value;
      }
    });

    console.log('Making request to:', API_ENDPOINTS.ARCHIVE.ANNOUNCEMENTS, 'with params:', params);
    return adminHttpClient.get<ArchiveResponse<ArchivedAnnouncement>>(API_ENDPOINTS.ARCHIVE.ANNOUNCEMENTS, params);
  }

  // Get archived calendar events
  async getArchivedCalendarEvents(
    filters: ArchiveFilters = {},
    pagination: ArchivePagination = {}
  ): Promise<ApiResponse<ArchiveResponse<ArchivedCalendarEvent>>> {
    const params: Record<string, any> = {};

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    // Add pagination
    Object.entries(pagination).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value;
      }
    });

    return adminHttpClient.get<ArchiveResponse<ArchivedCalendarEvent>>(API_ENDPOINTS.ARCHIVE.CALENDAR_EVENTS, params);
  }

  // Get archived students
  async getArchivedStudents(
    filters: ArchiveFilters = {},
    pagination: ArchivePagination = {}
  ): Promise<ApiResponse<ArchiveResponse<ArchivedStudent>>> {
    const params: Record<string, any> = {};

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    // Add pagination
    Object.entries(pagination).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = value;
      }
    });

    return adminHttpClient.get<ArchiveResponse<ArchivedStudent>>(API_ENDPOINTS.ARCHIVE.STUDENTS, params);
  }

  // Get archive statistics
  async getArchiveStatistics(): Promise<ApiResponse<ArchiveStatistics>> {
    console.log('Making request to:', API_ENDPOINTS.ARCHIVE.STATISTICS);
    return adminHttpClient.get<ArchiveStatistics>(API_ENDPOINTS.ARCHIVE.STATISTICS);
  }

  // Restore archived announcement
  async restoreAnnouncement(announcementId: number): Promise<ApiResponse<{ announcement: ArchivedAnnouncement }>> {
    return adminHttpClient.put<{ announcement: ArchivedAnnouncement }>(API_ENDPOINTS.ARCHIVE.RESTORE_ANNOUNCEMENT(announcementId.toString()));
  }

  // Restore archived calendar event
  async restoreCalendarEvent(eventId: number): Promise<ApiResponse<void>> {
    return adminHttpClient.put<void>(API_ENDPOINTS.ARCHIVE.RESTORE_CALENDAR_EVENT(eventId.toString()));
  }

  // Restore archived student
  async restoreStudent(studentId: number): Promise<ApiResponse<{ student: ArchivedStudent }>> {
    return adminHttpClient.put<{ student: ArchivedStudent }>(API_ENDPOINTS.ARCHIVE.RESTORE_STUDENT(studentId.toString()));
  }

  // Permanently delete announcement
  async permanentlyDeleteAnnouncement(announcementId: number): Promise<ApiResponse<void>> {
    return adminHttpClient.delete<void>(API_ENDPOINTS.ARCHIVE.PERMANENT_DELETE_ANNOUNCEMENT(announcementId.toString()));
  }
}

export const archiveService = new ArchiveService();
export default archiveService;
