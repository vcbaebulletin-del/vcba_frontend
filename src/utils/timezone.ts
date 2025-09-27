/**
 * Timezone utility functions for Philippines (Asia/Manila) timezone
 * Frontend implementation using native JavaScript Date and Intl APIs
 */

export const PHILIPPINES_TIMEZONE = 'Asia/Manila';

/**
 * Get current date/time in Philippines timezone
 * @returns {Date} Current date in Philippines timezone
 */
export const now = (): Date => {
  return new Date();
};

/**
 * Format date for display in Philippines timezone
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    ...options,
    timeZone: PHILIPPINES_TIMEZONE
  });
};

/**
 * Format time for display in Philippines timezone
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    ...options,
    timeZone: PHILIPPINES_TIMEZONE
  });
};

/**
 * Format date and time for display in Philippines timezone
 * @param {Date | string} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    ...options,
    timeZone: PHILIPPINES_TIMEZONE
  });
};

/**
 * Get current date/time formatted for datetime-local input in Philippines timezone
 * @returns {string} Formatted string for datetime-local input (YYYY-MM-DDTHH:MM)
 */
export const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  
  // Get Philippines time components
  const philippinesTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: PHILIPPINES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const year = philippinesTime.find(part => part.type === 'year')?.value;
  const month = philippinesTime.find(part => part.type === 'month')?.value;
  const day = philippinesTime.find(part => part.type === 'day')?.value;
  const hour = philippinesTime.find(part => part.type === 'hour')?.value;
  const minute = philippinesTime.find(part => part.type === 'minute')?.value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Format date for datetime-local input in Philippines timezone
 * @param {Date | string} date - Date to format
 * @returns {string} Formatted string for datetime-local input (YYYY-MM-DDTHH:MM)
 */
export const formatDateTimeLocal = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get Philippines time components
  const philippinesTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: PHILIPPINES_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(dateObj);

  const year = philippinesTime.find(part => part.type === 'year')?.value;
  const month = philippinesTime.find(part => part.type === 'month')?.value;
  const day = philippinesTime.find(part => part.type === 'day')?.value;
  const hour = philippinesTime.find(part => part.type === 'hour')?.value;
  const minute = philippinesTime.find(part => part.type === 'minute')?.value;

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Check if a date is today in Philippines timezone
 * @param {Date | string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  const dateStr = dateObj.toLocaleDateString('en-CA', { timeZone: PHILIPPINES_TIMEZONE });
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: PHILIPPINES_TIMEZONE });
  
  return dateStr === todayStr;
};

/**
 * Check if two dates are the same day in Philippines timezone
 * @param {Date | string} date1 - First date
 * @param {Date | string} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const date1Obj = typeof date1 === 'string' ? new Date(date1) : date1;
  const date2Obj = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const date1Str = date1Obj.toLocaleDateString('en-CA', { timeZone: PHILIPPINES_TIMEZONE });
  const date2Str = date2Obj.toLocaleDateString('en-CA', { timeZone: PHILIPPINES_TIMEZONE });
  
  return date1Str === date2Str;
};

/**
 * Check if two dates are in the same month in Philippines timezone
 * @param {Date | string} date - Date to check
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {boolean} True if date is in the same month
 */
export const isSameMonth = (date: Date | string, month: number, year: number): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const philippinesTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: PHILIPPINES_TIMEZONE,
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(dateObj);

  const dateYear = parseInt(philippinesTime.find(part => part.type === 'year')?.value || '0');
  const dateMonth = parseInt(philippinesTime.find(part => part.type === 'month')?.value || '0') - 1; // Convert to 0-11

  return dateYear === year && dateMonth === month;
};

/**
 * Get timezone offset for Philippines
 * @returns {string} Timezone offset (+08:00)
 */
export const getTimezoneOffset = (): string => {
  return '+08:00';
};

/**
 * Get timezone name
 * @returns {string} Timezone name (Asia/Manila)
 */
export const getTimezoneName = (): string => {
  return PHILIPPINES_TIMEZONE;
};

/**
 * Format date for display with relative time (e.g., "2 hours ago", "yesterday")
 * @param {Date | string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
};
