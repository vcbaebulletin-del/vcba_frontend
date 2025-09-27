// Import and re-export types from services for consistency
import type {
  CalendarEvent,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  PaginatedEventsResponse,
  CalendarViewResponse
} from '../services/calendarService';

export type {
  CalendarEvent,
  CreateEventData,
  UpdateEventData,
  EventFilters,
  PaginatedEventsResponse,
  CalendarViewResponse
};

// Additional frontend-specific types
export interface EventFormData {
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  category_id: string;
  subcategory_id?: string;
  is_recurring: boolean;
  recurrence_pattern?: 'yearly' | 'monthly' | 'weekly';
  is_active: boolean;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  onSave: (data: CreateEventData | UpdateEventData) => Promise<void>;
}

export interface CalendarCellProps {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  view: 'month' | 'week' | 'day';
  onViewChange: (view: 'month' | 'week' | 'day') => void;
}

export interface EventListProps {
  events: CalendarEvent[];
  loading: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}

export interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  categories: any[]; // Uses categories instead of holiday types
}

// Form validation types
export interface EventFormErrors {
  title?: string;
  event_date?: string;
  category_id?: string;
  end_date?: string;
  recurrence_pattern?: string;
}

// UI state types
export interface CalendarUIState {
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  showCreateModal: boolean;
  showEditModal: boolean;
  editingEvent?: CalendarEvent;
  selectedDate?: Date;
  loading: boolean;
  error?: string;
  success?: string;
}

// Calendar view types
export interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
  weekNumber: number;
}

export interface CalendarMonth {
  weeks: CalendarWeek[];
  year: number;
  month: number;
  monthName: string;
}

// Event display types
export interface EventDisplayProps {
  event: CalendarEvent;
  compact?: boolean;
  showActions?: boolean;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
}

// Action types for state management
export type CalendarAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUCCESS'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_EVENTS'; payload: CalendarEvent[] }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: CalendarEvent }
  | { type: 'DELETE_EVENT'; payload: number }
  | { type: 'SET_CURRENT_DATE'; payload: Date }
  | { type: 'SET_VIEW'; payload: 'month' | 'week' | 'day' }
  | { type: 'SHOW_CREATE_MODAL'; payload?: Date }
  | { type: 'HIDE_CREATE_MODAL' }
  | { type: 'SHOW_EDIT_MODAL'; payload: CalendarEvent }
  | { type: 'HIDE_EDIT_MODAL' };

// Hook return types
export interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  error?: string;
  currentDate: Date;
  view: 'month' | 'week' | 'day';
  calendarData: CalendarViewResponse;
  setCurrentDate: (date: Date) => void;
  setView: (view: 'month' | 'week' | 'day') => void;
  refresh: () => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<void>;
  updateEvent: (id: number, data: UpdateEventData) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForDateRange: (startDate: Date, endDate: Date) => Promise<CalendarEvent[]>;
}



// Utility types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarConfig {
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  showWeekNumbers: boolean;
  showWeekends: boolean;
  timeFormat: '12h' | '24h';
  dateFormat: string;
}

// Event color and styling
export interface EventStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}



// Calendar navigation
export interface CalendarNavigation {
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToDate: (date: Date) => void;
  goToMonth: (year: number, month: number) => void;
}

// Event recurrence
export interface RecurrenceRule {
  pattern: 'yearly' | 'monthly' | 'weekly' | 'daily';
  interval: number;
  endDate?: Date;
  count?: number;
}

// Calendar export/import
export interface CalendarExportOptions {
  format: 'ics' | 'csv' | 'json';
  dateRange?: DateRange;
  includeTypes?: number[];
}

export interface CalendarImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}
