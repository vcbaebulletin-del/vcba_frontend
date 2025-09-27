import { useState, useEffect, useCallback } from 'react';
import { calendarService } from '../services';
import { isToday as isPhilippinesToday, isSameMonth as isPhilippinesSameMonth, formatDate, formatTime } from '../utils/timezone';
import type {
  CalendarEvent,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  UseCalendarReturn,
  CalendarViewResponse
} from '../types/calendar.types';

// Hook for managing calendar events
export const useCalendar = (initialDate?: Date): UseCalendarReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarData, setCalendarData] = useState<CalendarViewResponse>({ events: {} });

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      const currentYear = currentDate.getFullYear();
      // Fetch events for multiple years (current year ± 2 years)
      const yearsToFetch = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

      // console.log(`📅 Fetching calendar data for years: ${yearsToFetch.join(', ')}...`);

      // Fetch events for all years in parallel
      const responses = await Promise.all(
        yearsToFetch.map(year => calendarService.getCalendarView(year, undefined))
      );

      // Merge all successful responses
      const mergedEvents: { [key: string]: any[] } = {};
      let totalEvents = 0;

      responses.forEach((response, index) => {
        if (response.success && response.data) {
          // Merge events from this year into the combined events object
          Object.entries(response.data.events).forEach(([date, dayEvents]) => {
            if (!mergedEvents[date]) {
              mergedEvents[date] = [];
            }
            mergedEvents[date].push(...(dayEvents as any[]));
            totalEvents += (dayEvents as any[]).length;
          });
        } else {
          console.warn(`⚠️ Failed to fetch data for year ${yearsToFetch[index]}:`, response.message);
        }
      });

      // Set the merged calendar data
      setCalendarData({ events: mergedEvents });

      // Convert grouped events to flat array for easier manipulation
      const flatEvents = Object.values(mergedEvents).flat();
      setEvents(flatEvents);

      // console.log(`✅ Calendar data loaded for years ${yearsToFetch.join(', ')}: ${totalEvents} events`);

      if (totalEvents === 0) {
        setError('No calendar data found for the requested years');
      }
    } catch (err: any) {
      // console.error('❌ Error fetching calendar data:', err);

      let errorMessage = 'An error occurred while fetching calendar data';
      if (err.message.includes('Network connection failed')) {
        errorMessage = 'Unable to connect to server. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentDate.getFullYear()]); // Only depend on year since we fetch entire year

  const refresh = useCallback(async () => {
    await fetchCalendarData();
  }, [fetchCalendarData]);

  const createEvent = useCallback(async (data: CreateEventData) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await calendarService.createEvent(data);
      
      if (response.success) {
        // Refresh calendar data to get the new event
        await fetchCalendarData();
      } else {
        throw new Error(response.message || 'Failed to create event');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCalendarData]);

  const updateEvent = useCallback(async (id: number, data: UpdateEventData) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await calendarService.updateEvent(id, data);
      
      if (response.success && response.data) {
        // Refresh the calendar data to ensure multi-day events are properly handled
        // This is more reliable than trying to manually update the complex calendar state
        await fetchCalendarData();
      } else {
        throw new Error(response.message || 'Failed to update event');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCalendarData]);

  const deleteEvent = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await calendarService.deleteEvent(id);
      
      if (response.success) {
        // Refresh the calendar data to ensure consistency
        await fetchCalendarData();
      } else {
        throw new Error(response.message || 'Failed to delete event');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting event');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCalendarData]);

  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    // Format date manually to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return calendarData.events[dateKey] || [];
  }, [calendarData]);

  const getEventsForDateRange = useCallback(async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    try {
      // Format dates manually to avoid timezone issues
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const start = formatDate(startDate);
      const end = formatDate(endDate);

      const response = await calendarService.getEventsByDateRange(start, end);

      if (response.success && response.data) {
        return response.data.events;
      } else {
        throw new Error(response.message || 'Failed to fetch events for date range');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching events for date range');
      return [];
    }
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  return {
    events,
    loading,
    error,
    currentDate,
    view,
    calendarData,
    setCurrentDate,
    setView,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForDateRange
  };
};

// Hook for managing calendar categories (returns only active categories and subcategories)
export const useCalendarCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Helper function to filter out deactivated and soft-deleted categories and subcategories
  const filterActiveCategories = useCallback((categories: any[]): any[] => {
    return categories
      .filter(category => {
        const isActive = category.is_active === true || category.is_active === 1;
        const isNotDeleted = category.deleted_at === null || category.deleted_at === undefined || !category.deleted_at;
        return isActive && isNotDeleted;
      })
      .map(category => ({
        ...category,
        // Filter out deactivated or soft-deleted subcategories
        subcategories: (category.subcategories || []).filter((subcategory: any) => {
          const isActive = subcategory.is_active === true || subcategory.is_active === 1;
          const isNotDeleted = subcategory.deleted_at === null || subcategory.deleted_at === undefined || !subcategory.deleted_at;
          return isActive && isNotDeleted;
        })
      }));
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      // Try the active categories endpoint first
      let response = await calendarService.getActiveCategoriesWithSubcategories();

      // If the active endpoint fails, fallback to regular endpoint and filter client-side
      if (!response.success) {
        response = await calendarService.getCategoriesWithSubcategories();
      }

      if (response.success && response.data) {
        // Apply client-side filtering to ensure only active categories are shown
        const filteredCategories = filterActiveCategories(response.data.categories || []);
        setCategories(filteredCategories);
      } else {
        setError(response.message || 'Failed to fetch categories');
      }
    } catch (err: any) {
      // Try fallback endpoint if the active endpoint throws an error
      try {
        const fallbackResponse = await calendarService.getCategoriesWithSubcategories();
        if (fallbackResponse.success && fallbackResponse.data) {
          const filteredCategories = filterActiveCategories(fallbackResponse.data.categories || []);
          setCategories(filteredCategories);
        } else {
          setError(fallbackResponse.message || 'Failed to fetch categories');
        }
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'An error occurred while fetching categories');
      }
    } finally {
      setLoading(false);
    }
  }, [filterActiveCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refresh = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh
  };
};

// Utility functions for calendar operations
export const getCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  const endDate = new Date(lastDay);
  
  // Adjust to start from Sunday (or Monday based on preference)
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // Adjust to end on Saturday (or Sunday based on preference)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

export const isToday = (date: Date): boolean => {
  return isPhilippinesToday(date);
};

export const isSameMonth = (date: Date, month: number, year: number): boolean => {
  return isPhilippinesSameMonth(date, month, year);
};

export const formatDateForDisplay = (date: Date): string => {
  return formatDate(date);
};

export const formatTimeForDisplay = (date: Date): string => {
  return formatTime(date);
};

export const getMonthName = (month: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month];
};

export const getDayName = (day: number): string => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[day];
};
