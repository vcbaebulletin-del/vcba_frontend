import { httpClient, adminHttpClient, studentHttpClient } from './api.service';

export interface CalendarReactionData {
  added?: boolean;
  removed?: boolean;
}

export interface CalendarReactionResponse {
  success: boolean;
  message: string;
  data: CalendarReactionData;
}

class CalendarReactionService {
  // No need to store client in constructor - get it dynamically each time

  /**
   * Get the appropriate HTTP client based on current authentication
   * Following the same pattern as AnnouncementService
   */
  private getAuthenticatedClient() {
    const studentToken = localStorage.getItem('studentToken');
    const studentUser = localStorage.getItem('studentUser');
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    console.log('🔍 CalendarReactionService - Auth detection:', {
      hasStudentToken: !!studentToken,
      hasStudentUser: !!studentUser,
      hasAdminToken: !!adminToken,
      hasAdminUser: !!adminUser,
      studentTokenPrefix: studentToken ? studentToken.substring(0, 10) + '...' : null,
      adminTokenPrefix: adminToken ? adminToken.substring(0, 10) + '...' : null
    });

    // Prefer student authentication if available
    if (studentToken && studentUser) {
      console.log('🎓 CalendarReactionService - Using STUDENT authentication');
      return studentHttpClient;
    } else if (adminToken && adminUser) {
      console.log('👨‍💼 CalendarReactionService - Using ADMIN authentication');
      return adminHttpClient;
    } else {
      console.log('🔧 CalendarReactionService - Using DEFAULT authentication');
      return httpClient;
    }
  }

  // Like a calendar event (following announcement pattern)
  async likeEvent(eventId: number): Promise<CalendarReactionResponse> {
    try {
      const client = this.getAuthenticatedClient();

      console.log('❤️ CalendarReactionService - Liking calendar event:', {
        eventId,
        clientType: client === adminHttpClient ? 'ADMIN' : client === studentHttpClient ? 'STUDENT' : 'DEFAULT'
      });

      const response = await client.post(`/api/calendar/${eventId}/like`, {});
      return {
        success: response.success,
        message: response.message,
        data: response.data || { added: false }
      };
    } catch (error: any) {
      console.error('Error liking calendar event:', error);
      throw new Error(error.message || 'Failed to like calendar event');
    }
  }

  // Unlike a calendar event (following announcement pattern)
  async unlikeEvent(eventId: number): Promise<CalendarReactionResponse> {
    try {
      const client = this.getAuthenticatedClient();

      console.log('💔 CalendarReactionService - Unliking calendar event:', {
        eventId,
        clientType: client === adminHttpClient ? 'ADMIN' : client === studentHttpClient ? 'STUDENT' : 'DEFAULT'
      });

      const response = await client.delete(`/api/calendar/${eventId}/like`);
      return {
        success: response.success,
        message: response.message,
        data: response.data || { removed: false }
      };
    } catch (error: any) {
      console.error('Error unliking calendar event:', error);
      throw new Error(error.message || 'Failed to unlike calendar event');
    }
  }

  // Toggle like/unlike for a calendar event
  async toggleLike(eventId: number, currentlyLiked: boolean): Promise<CalendarReactionResponse> {
    if (currentlyLiked) {
      return this.unlikeEvent(eventId);
    } else {
      return this.likeEvent(eventId);
    }
  }
}

export const calendarReactionService = new CalendarReactionService();
export default calendarReactionService;
