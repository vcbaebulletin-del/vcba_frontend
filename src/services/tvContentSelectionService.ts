import { adminHttpClient } from './api.service';
import { API_ENDPOINTS } from '../config/constants';
import { Announcement } from './announcementService';
import { CalendarEvent } from './calendarService';
import { ApiResponse } from '../types';

// Types for TV content selection
export interface TVContentItem {
  id: number;
  type: 'announcement' | 'calendar';
  title: string;
  content?: string;
  description?: string;
  date: string;
  category_name?: string;
  category_color?: string;
  author_name?: string;
  isSelected: boolean;
}

export interface TVSelectedContent {
  announcements: number[];
  calendarEvents: number[];
  lastUpdated: string;
}

class TVContentSelectionService {
  private selectedContent: TVSelectedContent;
  private listeners: ((content: TVSelectedContent) => void)[] = [];

  constructor() {
    this.selectedContent = {
      announcements: [],
      calendarEvents: [],
      lastUpdated: new Date().toISOString()
    };
    this.loadSelectedContent();
  }

  // Get all available content for TV selection (admin-created, non-holiday)
  async getAvailableContent(): Promise<{
    announcements: Announcement[];
    calendarEvents: CalendarEvent[];
  }> {
    try {
      // Fetch announcements (all are admin-created)
      const announcementsResponse = await adminHttpClient.get<ApiResponse<{
        announcements: Announcement[];
        total: number;
        page: number;
        limit: number;
      }>>(API_ENDPOINTS.ANNOUNCEMENTS.BASE, {
        params: {
          status: 'published',
          page: 1,
          limit: 50, // Get more items for selection
          sort_by: 'created_at',
          sort_order: 'DESC'
        }
      });

      // Fetch calendar events (exclude holidays)
      const calendarResponse = await adminHttpClient.get<ApiResponse<CalendarEvent[]>>(
        API_ENDPOINTS.CALENDAR.BASE,
        {
          params: {
            is_holiday: 0, // Exclude holidays
            is_active: 1,
            limit: 50,
            sort_by: 'event_date',
            sort_order: 'ASC'
          }
        }
      );

      const announcements = (announcementsResponse.data?.success && announcementsResponse.data?.data?.announcements)
        ? announcementsResponse.data.data.announcements
        : [];

      const calendarEvents = (calendarResponse.data?.success && calendarResponse.data?.data)
        ? calendarResponse.data.data
        : [];

      return {
        announcements,
        calendarEvents
      };
    } catch (error) {
      console.error('Error fetching available content:', error);
      return {
        announcements: [],
        calendarEvents: []
      };
    }
  }

  // Convert content to TV content items for display
  convertToTVContentItems(
    announcements: Announcement[], 
    calendarEvents: CalendarEvent[]
  ): TVContentItem[] {
    const items: TVContentItem[] = [];

    // Add announcements
    announcements.forEach(announcement => {
      items.push({
        id: announcement.announcement_id,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        date: announcement.created_at,
        category_name: announcement.category_name,
        category_color: announcement.category_color,
        author_name: announcement.author_name,
        isSelected: this.selectedContent.announcements.includes(announcement.announcement_id)
      });
    });

    // Add calendar events (non-holidays only)
    calendarEvents.forEach(event => {
      items.push({
        id: event.calendar_id,
        type: 'calendar',
        title: event.title,
        description: event.description,
        date: event.event_date,
        category_name: event.category_name,
        category_color: event.category_color,
        author_name: event.created_by_name,
        isSelected: this.selectedContent.calendarEvents.includes(event.calendar_id)
      });
    });

    // Sort by date (newest first for announcements, upcoming first for events)
    return items.sort((a, b) => {
      if (a.type === 'announcement' && b.type === 'announcement') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (a.type === 'calendar' && b.type === 'calendar') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        // Mixed types: announcements first, then events
        return a.type === 'announcement' ? -1 : 1;
      }
    });
  }

  // Toggle selection for a content item
  toggleContentSelection(id: number, type: 'announcement' | 'calendar'): void {
    if (type === 'announcement') {
      const index = this.selectedContent.announcements.indexOf(id);
      if (index > -1) {
        this.selectedContent.announcements.splice(index, 1);
      } else {
        this.selectedContent.announcements.push(id);
      }
    } else {
      const index = this.selectedContent.calendarEvents.indexOf(id);
      if (index > -1) {
        this.selectedContent.calendarEvents.splice(index, 1);
      } else {
        this.selectedContent.calendarEvents.push(id);
      }
    }

    this.selectedContent.lastUpdated = new Date().toISOString();
    this.saveSelectedContent();
    this.notifyListeners();
  }

  // Get selected content
  getSelectedContent(): TVSelectedContent {
    return { ...this.selectedContent };
  }

  // Set selected content (for bulk operations)
  setSelectedContent(content: Partial<TVSelectedContent>): void {
    this.selectedContent = {
      ...this.selectedContent,
      ...content,
      lastUpdated: new Date().toISOString()
    };
    this.saveSelectedContent();
    this.notifyListeners();
  }

  // Clear all selections
  clearAllSelections(): void {
    this.selectedContent = {
      announcements: [],
      calendarEvents: [],
      lastUpdated: new Date().toISOString()
    };
    this.saveSelectedContent();
    this.notifyListeners();
  }

  // Check if any content is selected
  hasSelectedContent(): boolean {
    return this.selectedContent.announcements.length > 0 || 
           this.selectedContent.calendarEvents.length > 0;
  }

  // Get count of selected items
  getSelectedCount(): { announcements: number; calendarEvents: number; total: number } {
    const announcements = this.selectedContent.announcements.length;
    const calendarEvents = this.selectedContent.calendarEvents.length;
    return {
      announcements,
      calendarEvents,
      total: announcements + calendarEvents
    };
  }

  // Event listeners
  onSelectionChange(callback: (content: TVSelectedContent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Private methods
  private loadSelectedContent(): void {
    try {
      const stored = localStorage.getItem('tv_selected_content');
      if (stored) {
        this.selectedContent = { ...this.selectedContent, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load TV selected content:', error);
    }
  }

  private saveSelectedContent(): void {
    try {
      localStorage.setItem('tv_selected_content', JSON.stringify(this.selectedContent));
    } catch (error) {
      console.warn('Failed to save TV selected content:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.selectedContent));
  }
}

// Export singleton instance
export const tvContentSelectionService = new TVContentSelectionService();
