/**
 * Server Time Service
 * 
 * This service provides secure, tamper-proof server time to prevent
 * client-side time manipulation and cheating attempts.
 * 
 * All times are retrieved from the server in Asia/Manila timezone (UTC+8).
 */

import { apiClient } from './api';

export interface ServerTimeResponse {
  timestamp: string;
  unix: number;
  timezone: string;
  offset: string;
  formatted: string;
  date: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

export interface TimeValidationResponse {
  server_time: {
    timestamp: string;
    unix: number;
    formatted: string;
  };
  client_time: {
    timestamp: string;
    unix: number;
    formatted: string;
  };
  difference: {
    seconds: number;
    minutes: number;
    hours: number;
  };
  is_suspicious: boolean;
  threshold: number;
  timezone: string;
}

export interface TimeFormatResponse {
  original: string;
  formatted: string;
  timezone: string;
  offset: string;
  iso: string;
  unix: number;
}

export interface TimeRangeResponse {
  current_time: {
    timestamp: string;
    formatted: string;
  };
  start_time: {
    timestamp: string;
    formatted: string;
  };
  end_time: {
    timestamp: string;
    formatted: string;
  };
  is_within_range: boolean;
  time_until_start: number;
  time_until_end: number;
  timezone: string;
}

class TimeService {
  private baseUrl = '/api/time';
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_CACHE_TTL = 30000; // 30 seconds

  /**
   * Get current server time in Asia/Manila timezone
   * 
   * @param useCache - Whether to use cached result (default: true)
   * @param cacheTTL - Cache time-to-live in milliseconds (default: 30000)
   * @returns Promise<ServerTimeResponse>
   */
  async getCurrentTime(useCache: boolean = true, cacheTTL: number = this.DEFAULT_CACHE_TTL): Promise<ServerTimeResponse> {
    const cacheKey = 'current_time';
    
    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await apiClient.get<{ success: boolean; data: ServerTimeResponse }>(`${this.baseUrl}/current`);
      
      if (!response.data.success) {
        throw new Error('Failed to get server time');
      }

      const serverTime = response.data.data;
      
      // Cache the result
      if (useCache) {
        this.setCache(cacheKey, serverTime, cacheTTL);
      }

      return serverTime;
    } catch (error) {
      console.error('❌ TimeService: Failed to get current server time:', error);
      throw new Error('Unable to retrieve secure server time. Please check your connection.');
    }
  }

  /**
   * Validate client time against server time to detect tampering
   * 
   * @param clientTime - Client's reported timestamp (ISO string or Date)
   * @returns Promise<TimeValidationResponse>
   */
  async validateTime(clientTime: string | Date): Promise<TimeValidationResponse> {
    try {
      const clientTimeString = clientTime instanceof Date ? clientTime.toISOString() : clientTime;
      
      const response = await apiClient.get<{ success: boolean; data: TimeValidationResponse }>(
        `${this.baseUrl}/validate`,
        {
          params: { client_time: clientTimeString }
        }
      );
      
      if (!response.data.success) {
        throw new Error('Failed to validate time');
      }

      const validation = response.data.data;
      
      // Log suspicious activity
      if (validation.is_suspicious) {
        console.warn(`🚨 TimeService: Suspicious time difference detected: ${validation.difference.seconds}s`);
      }

      return validation;
    } catch (error) {
      console.error('❌ TimeService: Failed to validate time:', error);
      throw new Error('Unable to validate time with server.');
    }
  }

  /**
   * Format a timestamp using server-side formatting in Asia/Manila timezone
   * 
   * @param timestamp - Timestamp to format (ISO string, Unix timestamp, or Date)
   * @param format - Optional format string (defaults to server default)
   * @returns Promise<TimeFormatResponse>
   */
  async formatTime(timestamp: string | number | Date, format?: string): Promise<TimeFormatResponse> {
    try {
      let timestampString: string;
      
      if (timestamp instanceof Date) {
        timestampString = timestamp.toISOString();
      } else if (typeof timestamp === 'number') {
        timestampString = new Date(timestamp).toISOString();
      } else {
        timestampString = timestamp;
      }

      const params: any = { timestamp: timestampString };
      if (format) {
        params.format = format;
      }

      const response = await apiClient.get<{ success: boolean; data: TimeFormatResponse }>(
        `${this.baseUrl}/format`,
        { params }
      );
      
      if (!response.data.success) {
        throw new Error('Failed to format time');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ TimeService: Failed to format time:', error);
      throw new Error('Unable to format time using server.');
    }
  }

  /**
   * Check if current server time is within a specified range
   * 
   * @param startTime - Start of time range (ISO string or Date)
   * @param endTime - End of time range (ISO string or Date)
   * @returns Promise<TimeRangeResponse>
   */
  async checkTimeRange(startTime: string | Date, endTime: string | Date): Promise<TimeRangeResponse> {
    try {
      const startTimeString = startTime instanceof Date ? startTime.toISOString() : startTime;
      const endTimeString = endTime instanceof Date ? endTime.toISOString() : endTime;

      const response = await apiClient.get<{ success: boolean; data: TimeRangeResponse }>(
        `${this.baseUrl}/range`,
        {
          params: {
            start_time: startTimeString,
            end_time: endTimeString
          }
        }
      );
      
      if (!response.data.success) {
        throw new Error('Failed to check time range');
      }

      return response.data.data;
    } catch (error) {
      console.error('❌ TimeService: Failed to check time range:', error);
      throw new Error('Unable to check time range with server.');
    }
  }

  /**
   * Get a Date object representing current server time
   * This is a convenience method that returns a JavaScript Date object
   * 
   * @param useCache - Whether to use cached result (default: true)
   * @returns Promise<Date>
   */
  async getServerDate(useCache: boolean = true): Promise<Date> {
    const serverTime = await this.getCurrentTime(useCache);
    return new Date(serverTime.timestamp);
  }

  /**
   * Get current server time as Unix timestamp (milliseconds)
   * 
   * @param useCache - Whether to use cached result (default: true)
   * @returns Promise<number>
   */
  async getServerTimestamp(useCache: boolean = true): Promise<number> {
    const serverTime = await this.getCurrentTime(useCache);
    return serverTime.unix;
  }

  /**
   * Format a relative time string (e.g., "2 hours ago") using server time
   * This prevents client-side time manipulation in relative time calculations
   * 
   * @param timestamp - Timestamp to compare against (ISO string or Date)
   * @param useCache - Whether to use cached server time (default: true)
   * @returns Promise<string>
   */
  async getRelativeTime(timestamp: string | Date, useCache: boolean = true): Promise<string> {
    try {
      const serverTime = await this.getCurrentTime(useCache);
      const targetTime = new Date(timestamp instanceof Date ? timestamp.toISOString() : timestamp);
      const serverDate = new Date(serverTime.timestamp);
      
      const diffInSeconds = Math.floor((serverDate.getTime() - targetTime.getTime()) / 1000);

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
        // For older dates, use server-side formatting
        const formatted = await this.formatTime(timestamp, 'MMM D, YYYY');
        return formatted.formatted;
      }
    } catch (error) {
      console.error('❌ TimeService: Failed to get relative time:', error);
      // Fallback to basic formatting without relative calculation
      return new Date(timestamp instanceof Date ? timestamp.toISOString() : timestamp).toLocaleDateString();
    }
  }

  /**
   * Clear the time cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get data from cache if it exists and hasn't expired
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set data in cache with TTL
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}

// Export singleton instance
export const timeService = new TimeService();

// Export utility functions for backward compatibility
export const getCurrentServerTime = () => timeService.getCurrentTime();
export const getServerDate = () => timeService.getServerDate();
export const getServerTimestamp = () => timeService.getServerTimestamp();
export const formatServerTime = (timestamp: string | number | Date, format?: string) => 
  timeService.formatTime(timestamp, format);
export const getRelativeServerTime = (timestamp: string | Date) => 
  timeService.getRelativeTime(timestamp);

export default timeService;
