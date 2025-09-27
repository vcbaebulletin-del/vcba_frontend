/**
 * Date utilities for handling Philippines timezone and date formatting
 */

/**
 * Get current date in Philippines timezone
 * @returns Date object adjusted for Philippines timezone
 */
export const getPhilippinesDate = (): Date => {
  const now = new Date();
  // Philippines is UTC+8
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const philippinesTime = new Date(utc + (8 * 3600000));
  return philippinesTime;
};

/**
 * Format date for HTML input fields
 * @param date - Date to format
 * @param type - Type of input ('date', 'month', 'datetime-local')
 * @returns Formatted date string
 */
export const formatDateForInput = (date: Date, type: 'date' | 'month' | 'datetime-local' = 'date'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (type) {
    case 'month':
      return `${year}-${month}`;
    case 'date':
      return `${year}-${month}-${day}`;
    case 'datetime-local':
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * Get Philippines date string in YYYY-MM-DD format
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export const getPhilippinesDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Validate if a date range is valid
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Object with validation result and error message
 */
export const isValidDateRange = (startDate: string, endDate: string): { valid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  // Check if date range is not too large (e.g., more than 1 year)
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    return { valid: false, error: 'Date range cannot exceed 365 days' };
  }

  return { valid: true };
};

/**
 * Calculate week start and end dates for a given date
 * @param date - Date to calculate week for
 * @returns Object with week start and end dates
 */
export const getWeekRange = (date: Date): { weekStart: Date; weekEnd: Date } => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate offset to Monday
  
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

/**
 * Get month start and end dates for a given month string
 * @param monthString - Month in YYYY-MM format
 * @returns Object with month start and end dates
 */
export const getMonthRange = (monthString: string): { monthStart: Date; monthEnd: Date } => {
  const [year, month] = monthString.split('-').map(Number);
  
  const monthStart = new Date(year, month - 1, 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(year, month, 0); // Last day of the month
  monthEnd.setHours(23, 59, 59, 999);
  
  return { monthStart, monthEnd };
};

/**
 * Format date for display in Philippines locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatPhilippinesDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-PH', { ...defaultOptions, ...options });
};

/**
 * Get date range presets for quick selection
 * @returns Array of preset date ranges
 */
export const getDateRangePresets = () => {
  const today = getPhilippinesDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);
  
  const last3Months = new Date(today);
  last3Months.setMonth(today.getMonth() - 3);
  
  return [
    {
      label: 'Today',
      startDate: formatDateForInput(today),
      endDate: formatDateForInput(today)
    },
    {
      label: 'Yesterday',
      startDate: formatDateForInput(yesterday),
      endDate: formatDateForInput(yesterday)
    },
    {
      label: 'Last 7 Days',
      startDate: formatDateForInput(lastWeek),
      endDate: formatDateForInput(today)
    },
    {
      label: 'Last 30 Days',
      startDate: formatDateForInput(lastMonth),
      endDate: formatDateForInput(today)
    },
    {
      label: 'Last 3 Months',
      startDate: formatDateForInput(last3Months),
      endDate: formatDateForInput(today)
    }
  ];
};
