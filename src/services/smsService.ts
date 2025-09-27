import { apiClient as api } from './api';

export interface SMSConfig {
  apiKey: string;
  deviceId: string;
  baseURL: string;
  isEnabled: boolean;
  rateLimitPerMinute: number;
}

export interface SMSTestRequest {
  phoneNumber: string;
  message: string;
}

export interface SMSTestResponse {
  success: boolean;
  message: string;
  details?: any;
}

export interface SMSStatusResponse {
  enabled: boolean;
  apiKey: string;
  deviceId: string;
  rateLimitPerMinute: number;
  baseURL: string;
}

export interface SMSStatistics {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

class SMSService {
  private baseURL = '/api/sms';

  /**
   * Check if SMS service is available (no auth required)
   */
  async checkHealth(): Promise<{ success: boolean; message: string; timestamp: string }> {
    try {
      console.log('🏥 Checking SMS service health...');
      const response = await api.get(`${this.baseURL}/health`);
      console.log('✅ SMS service health check passed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ SMS service health check failed:', error);
      throw error;
    }
  }

  /**
   * Get SMS service status and configuration
   */
  async getStatus(): Promise<SMSStatusResponse> {
    try {
      console.log('📡 Fetching SMS status from:', `${this.baseURL}/status`);
      const response = await api.get(`${this.baseURL}/status`);
      console.log('✅ SMS status response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error getting SMS status:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: this.baseURL
      });

      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error(`SMS status endpoint not found. Please check if the backend server is running and the SMS routes are properly configured.`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error(`Cannot connect to the backend server. Please ensure the server is running on the correct port.`);
      } else if (error.response?.status === 401) {
        throw new Error(`Unauthorized access to SMS settings. Please check your admin permissions.`);
      } else if (error.response?.status === 403) {
        throw new Error(`Access forbidden. You don't have permission to access SMS settings.`);
      }

      throw error;
    }
  }

  /**
   * Get full SMS configuration for editing (unmasked values)
   */
  async getFullConfig(): Promise<SMSStatusResponse> {
    try {
      console.log('📡 Fetching full SMS config from:', `${this.baseURL}/config`);
      const response = await api.get(`${this.baseURL}/config`);
      console.log('✅ Full SMS config response:', {
        ...response.data.data,
        apiKey: response.data.data.apiKey ? `${response.data.data.apiKey.substring(0, 8)}...` : 'Not set',
        deviceId: response.data.data.deviceId ? `${response.data.data.deviceId.substring(0, 8)}...` : 'Not set'
      });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error getting full SMS config:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: this.baseURL
      });

      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error(`SMS config endpoint not found. Please check if the backend server is running and the SMS routes are properly configured.`);
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error(`Cannot connect to the backend server. Please ensure the server is running on the correct port.`);
      } else if (error.response?.status === 401) {
        throw new Error(`Unauthorized access to SMS settings. Please check your admin permissions.`);
      } else if (error.response?.status === 403) {
        throw new Error(`Access forbidden. You don't have permission to access SMS settings.`);
      }

      throw error;
    }
  }

  /**
   * Update SMS configuration
   */
  async updateConfig(config: Partial<SMSConfig>): Promise<void> {
    try {
      await api.put(`${this.baseURL}/config`, config);
    } catch (error) {
      console.error('Error updating SMS config:', error);
      throw error;
    }
  }

  /**
   * Test SMS service by sending a test message
   */
  async sendTestMessage(request: SMSTestRequest): Promise<SMSTestResponse> {
    try {
      const response = await api.post(`${this.baseURL}/test`, request);
      return response.data;
    } catch (error) {
      console.error('Error sending test SMS:', error);
      throw error;
    }
  }

  /**
   * Get SMS statistics
   */
  async getStatistics(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<SMSStatistics> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);

      const response = await api.get(`${this.baseURL}/statistics?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting SMS statistics:', error);
      throw error;
    }
  }

  /**
   * Get SMS notification history
   */
  async getNotificationHistory(options?: {
    page?: number;
    limit?: number;
    phoneNumber?: string;
    status?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.page) params.append('page', options.page.toString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.phoneNumber) params.append('phoneNumber', options.phoneNumber);
      if (options?.status) params.append('status', options.status);

      const response = await api.get(`${this.baseURL}/history?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting SMS history:', error);
      throw error;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Philippine mobile number
    // Philippine mobile numbers: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX (13 digits with country code)
    if (cleaned.length === 11 && cleaned.startsWith('09')) {
      return true;
    }
    if (cleaned.length === 13 && cleaned.startsWith('639')) {
      return true;
    }
    
    return false;
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Convert to international format for display
    if (cleaned.length === 11 && cleaned.startsWith('09')) {
      return '+63' + cleaned.substring(1); // Remove leading 0, add +63
    }
    if (cleaned.length === 13 && cleaned.startsWith('639')) {
      return '+' + cleaned; // Add + prefix
    }
    if (cleaned.length === 12 && cleaned.startsWith('63')) {
      return '+' + cleaned; // Add + prefix
    }
    
    return phoneNumber; // Return as-is if format is unclear
  }

  /**
   * Get SMS templates for different notification types
   */
  getTemplates() {
    return {
      announcement_alert: {
        title: '🚨 VCBA Alert Announcement',
        template: 'VCBA ALERT: {title}\n\n{content}\n\nPosted: {date}\nGrade: {grade_level}\n\nVCBA E-Bulletin Board'
      },
      calendar_alert: {
        title: '📅 VCBA Calendar Alert',
        template: 'VCBA CALENDAR ALERT: {title}\n\n{description}\n\nDate: {event_date}\n\nVCBA E-Bulletin Board'
      },
      test_message: {
        title: '🧪 VCBA Test Message',
        template: 'VCBA SMS Test - Service is working correctly!\n\nSent: {timestamp}\n\nVCBA E-Bulletin Board'
      }
    };
  }
}

export const smsService = new SMSService();
export default smsService;
