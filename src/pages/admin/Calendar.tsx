import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCalendar, getCalendarDays, isToday, isSameMonth, getMonthName } from '../../hooks/useCalendar';
import { useCategories } from '../../hooks/useAnnouncements';
import CalendarEventModal from '../../components/admin/modals/CalendarEventModal';
import type { CalendarEvent, CreateEventData, UpdateEventData } from '../../types/calendar.types';
import { calendarService } from '../../services/calendarService';
import { Calendar as CalendarIcon, Search, RefreshCw, Trash2, Edit, Send, Clock, Image as ImageIcon, AlertTriangle, MessageCircle, Heart, Star, Repeat } from 'lucide-react';
import CalendarEventLikeButton from '../../components/common/CalendarEventLikeButton';
import HolidayManagement from '../../components/admin/HolidayManagement';
// Removed calendar attachment imports since this feature is not yet implemented

const Calendar: React.FC = React.memo(() => {
  // Add CSS animation for spinning refresh icon and scrollbar styling
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Custom scrollbar styling for calendar day events */
      .calendar-day-events::-webkit-scrollbar {
        width: 4px;
      }

      .calendar-day-events::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 2px;
      }

      .calendar-day-events::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }

      .calendar-day-events::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showHolidayManagement, setShowHolidayManagement] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Scrollable day hover state
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Event attachments state - disabled until backend implementation is complete
  // const [eventAttachments, setEventAttachments] = useState<Record<number, CalendarAttachment[]>>({});

  // Use the calendar hook
  const {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    getEventsForDate,
    refresh
  } = useCalendar(currentDate);

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage, error]);

  const handleCreateEvent = useCallback((date?: Date) => {
    setEditingEvent(null);
    setSelectedDate(date || null);
    setShowModal(true);
  }, []);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setShowModal(true);
  }, []);



  const handleSaveEvent = useCallback(async (
    data: CreateEventData | UpdateEventData,
    applyPendingDeletes?: () => Promise<void>,
    onComplete?: (createdEventId?: number) => Promise<void>
  ) => {
    setSaving(true);
    try {
      let createdEventId: number | undefined;

      if (editingEvent) {
        await updateEvent(editingEvent.calendar_id, data as UpdateEventData);

        // Apply pending image deletions AFTER successful update
        if (applyPendingDeletes) {
          console.log('🗑️ Applying pending image deletions after successful update');
          await applyPendingDeletes();
        }

        setSuccessMessage('Event updated successfully! Calendar refreshed.');
      } else {
        // For create mode, we need to capture the created event ID
        const createResponse = await calendarService.createEvent(data as CreateEventData);
        if (createResponse.success && createResponse.data?.event) {
          createdEventId = createResponse.data.event.calendar_id;
          console.log(`✅ Event created with ID: ${createdEventId}`);
        }
        setSuccessMessage('Event created successfully! Calendar refreshed.');
      }

      // Execute completion callback for additional operations
      // Pass the created event ID for image upload in create mode
      if (onComplete) {
        await onComplete(createdEventId);
      }

      // Force refresh the calendar to ensure immediate update
      console.log('🔄 Refreshing calendar to show updated events...');
      setRefreshing(true);
      await refresh();
      setRefreshing(false);

      // Small delay to ensure smooth UI transition
      setTimeout(() => {
        setShowModal(false);
        setEditingEvent(null);
        setSelectedDate(null);
        setSaving(false);
      }, 100);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save event');
      setSaving(false);
    }
  }, [editingEvent, updateEvent, createEvent, refresh]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingEvent(null);
    setSelectedDate(null);
  }, []);

  // Event management functions
  const handlePublishEvent = useCallback(async (eventId: number) => {
    try {
      await calendarService.publishEvent(eventId);
      setSuccessMessage('Event published successfully');
      refresh(); // Refresh calendar data
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to publish event');
    }
  }, [refresh]);

  const handleUnpublishEvent = useCallback(async (eventId: number) => {
    try {
      await calendarService.unpublishEvent(eventId);
      setSuccessMessage('Event unpublished successfully');
      refresh(); // Refresh calendar data
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to unpublish event');
    }
  }, [refresh]);

  const handleDeleteEvent = useCallback(async (eventId: number) => {
    // Use window.confirm to avoid ESLint error
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await calendarService.softDeleteEvent(eventId);
      setSuccessMessage('Event deleted successfully');
      refresh(); // Refresh calendar data
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete event');
    }
  }, [refresh]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  }, [currentDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    handleCreateEvent(date);
  }, [handleCreateEvent]);

  const getEventTypeColor = useCallback((event: CalendarEvent) => {
    // Use category color if available, otherwise subcategory color, otherwise default
    return event.category_color || event.subcategory_color || '#22c55e';
  }, []);

  // Helper function to format event duration
  const getEventDuration = useCallback((event: CalendarEvent) => {
    if (!event.end_date || event.end_date === event.event_date) {
      return 'Single day event';
    }

    const startDate = new Date(event.event_date);
    const endDate = new Date(event.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days

    return `${diffDays} day event`;
  }, []);

  // Helper function to get first two words from event title for calendar chip display
  const getEventChipTitle = useCallback((title: string) => {
    const words = title.trim().split(/\s+/);
    return words.slice(0, 2).join(' ');
  }, []);

  // Memoize calendar days to prevent infinite re-renders
  const days = useMemo(() => {
    return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  // Get unique events for the event list (deduplicate multi-day events)
  const uniqueEvents = useMemo(() => {
    const eventMap = new Map();

    events.forEach(event => {
      // Use calendar_id as the unique identifier
      if (!eventMap.has(event.calendar_id)) {
        eventMap.set(event.calendar_id, event);
      }
    });

    const uniqueEventsList = Array.from(eventMap.values()).sort((a, b) => {
      // Sort by event_date, then by title
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.title.localeCompare(b.title);
    });

    // Debug: Log deduplication results
    console.log(`📊 Event deduplication: ${events.length} total events → ${uniqueEventsList.length} unique events`);

    return uniqueEventsList;
  }, [events]);

  // Filter events based on search term and holiday type (exclude holidays from the list)
  const filteredEvents = useMemo(() => {
    return uniqueEvents.filter(event => {
      // Exclude holidays from the events list
      const isNotHoliday = !event.is_holiday;

      const matchesSearch = !searchTerm ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory ||
        event.category_id?.toString() === selectedCategory;

      return isNotHoliday && matchesSearch && matchesCategory;
    });
  }, [uniqueEvents, searchTerm, selectedCategory]);

  // Pagination calculations
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  // Fetch attachments for visible events - disabled until backend implementation is complete
  // useEffect(() => {
  //   const fetchAttachments = async () => {
  //     if (!paginatedEvents || paginatedEvents.length === 0) return;
  //     // Attachment functionality will be implemented later
  //   };
  //   fetchAttachments();
  // }, [paginatedEvents]);

  // Component to display event images - disabled until backend implementation is complete
  const EventImages: React.FC<{ eventId: number }> = ({ eventId }) => {
    return (
      <div style={{
        width: '60px',
        height: '60px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '0.75rem'
      }}>
        <ImageIcon size={20} />
      </div>
    );
  };

  // Component to display individual image thumbnail - disabled until backend implementation is complete
  // const EventImageThumbnail: React.FC<{ attachment: any }> = ({ attachment }) => {
  //   // This component will be implemented when the backend supports file attachments
  //   return null;
  // };

  // Pagination component - Always visible
  const PaginationControls = () => {
    // Always show pagination controls, even for single page
    const effectiveTotalPages = Math.max(totalPages, 1); // Ensure at least 1 page
    const effectiveCurrentPage = Math.max(currentPage, 1); // Ensure at least page 1

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (effectiveTotalPages <= maxVisiblePages) {
        for (let i = 1; i <= effectiveTotalPages; i++) {
          pages.push(i);
        }
      } else {
        if (effectiveCurrentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', effectiveTotalPages);
        } else if (effectiveCurrentPage >= effectiveTotalPages - 2) {
          pages.push(1, '...', effectiveTotalPages - 3, effectiveTotalPages - 2, effectiveTotalPages - 1, effectiveTotalPages);
        } else {
          pages.push(1, '...', effectiveCurrentPage - 1, effectiveCurrentPage, effectiveCurrentPage + 1, '...', effectiveTotalPages);
        }
      }

      return pages;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Items per page selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>per page</span>
        </div>

        {/* Page info */}
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Showing {Math.max(totalItems > 0 ? startIndex + 1 : 0, 0)}-{Math.min(endIndex, totalItems)} of {totalItems} events
        </div>

        {/* Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={effectiveCurrentPage === 1}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: effectiveCurrentPage === 1 ? '#f3f4f6' : 'white',
              color: effectiveCurrentPage === 1 ? '#9ca3af' : '#374151',
              cursor: effectiveCurrentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            First
          </button>

          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={effectiveCurrentPage === 1}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: effectiveCurrentPage === 1 ? '#f3f4f6' : 'white',
              color: effectiveCurrentPage === 1 ? '#9ca3af' : '#374151',
              cursor: effectiveCurrentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Previous
          </button>

          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: page === effectiveCurrentPage ? '#3b82f6' : page === '...' ? 'transparent' : 'white',
                color: page === effectiveCurrentPage ? 'white' : page === '...' ? '#9ca3af' : '#374151',
                cursor: page === '...' ? 'default' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: page === effectiveCurrentPage ? '600' : '400'
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(effectiveTotalPages, prev + 1))}
            disabled={effectiveCurrentPage === effectiveTotalPages}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: effectiveCurrentPage === effectiveTotalPages ? '#f3f4f6' : 'white',
              color: effectiveCurrentPage === effectiveTotalPages ? '#9ca3af' : '#374151',
              cursor: effectiveCurrentPage === effectiveTotalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Next
          </button>

          <button
            onClick={() => setCurrentPage(effectiveTotalPages)}
            disabled={effectiveCurrentPage === effectiveTotalPages}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: effectiveCurrentPage === effectiveTotalPages ? '#f3f4f6' : 'white',
              color: effectiveCurrentPage === effectiveTotalPages ? '#9ca3af' : '#374151',
              cursor: effectiveCurrentPage === effectiveTotalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          borderRadius: '8px'
        }}>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: '8px'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Calendar Header */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e8f5e8',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#2d5016',
              margin: 0
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CalendarIcon size={16} color="#1e40af" />
                School Calendar
                {refreshing && (
                  <RefreshCw
                    size={14}
                    color="#22c55e"
                    style={{
                      animation: 'spin 1s linear infinite',
                      marginLeft: '0.25rem'
                    }}
                  />
                )}
              </span>
            </h1>
            <p style={{
              color: '#6b7280',
              margin: '0 0 0 0.5rem',
              fontSize: '0.875rem'
            }}>
              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigateMonth('prev')}
              style={{
                padding: '0.25rem',
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#374151'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              ←
            </button>

            <button
              onClick={goToToday}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              Today
            </button>

            <button
              onClick={() => navigateMonth('next')}
              style={{
                padding: '0.25rem',
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#374151'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              →
            </button>

            <button
              onClick={() => setShowHolidayManagement(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Star size={16} />
              Holidays
            </button>

            <button
              onClick={() => handleCreateEvent()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              + Add Event
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8',
        overflow: 'hidden'
      }}>
        {/* Calendar Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} style={{
              padding: '1rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate.getMonth(), currentDate.getFullYear());
            const isTodayDate = isToday(date);

            // Create unique key based on date to prevent React key conflicts
            // Use date timestamp as key since it's unique and stable across re-renders
            const dateKey = `calendar-day-${date.getTime()}`;

            return (
              <div
                key={dateKey}
                style={{
                  minHeight: '120px',
                  padding: '0.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  borderRight: index % 7 === 6 ? 'none' : '1px solid #e5e7eb', // Remove right border on last column
                  cursor: 'pointer',
                  backgroundColor: !isCurrentMonth ? '#f9fafb' : isTodayDate ? '#eff6ff' : 'white',
                  color: !isCurrentMonth ? '#9ca3af' : '#374151',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => handleDateClick(date)}
                onMouseEnter={(e) => {
                  if (isCurrentMonth) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px #22c55e20';
                    // Enable scrolling if there are more than 3 events
                    if (dayEvents.length > 3) {
                      setHoveredDay(dateKey);
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = !isCurrentMonth ? '#f9fafb' : isTodayDate ? '#eff6ff' : 'white';
                  e.currentTarget.style.boxShadow = 'none';
                  setHoveredDay(null);
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.25rem',
                  color: isTodayDate ? '#2563eb' : 'inherit'
                }}>
                  {date.getDate()}
                </div>
                <div
                  className="calendar-day-events"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    // Enable scrolling when hovered and has more than 3 events
                    maxHeight: hoveredDay === dateKey && dayEvents.length > 3 ? '80px' : 'auto',
                    overflowY: hoveredDay === dateKey && dayEvents.length > 3 ? 'auto' : 'visible',
                    // Custom scrollbar styling for Firefox
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9',
                    // Smooth transition
                    transition: 'max-height 0.2s ease-in-out'
                  }}>
                  {(hoveredDay === dateKey ? dayEvents : dayEvents.slice(0, 3)).map((event) => {
                    // Determine styling for multi-day events
                    const isMultiDay = event.isMultiDay;
                    const isStart = event.isEventStart;
                    const isEnd = event.isEventEnd;
                    const isContinuation = isMultiDay && !isStart && !isEnd;
                    const eventColor = getEventTypeColor(event);

                    return (
                      <div
                        key={`event-${event.calendar_id}-${date.getTime()}`}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: isMultiDay ? (isStart ? '6px 2px 2px 6px' : isEnd ? '2px 6px 6px 2px' : '2px') : '6px',
                          backgroundColor: eventColor + (isContinuation ? '25' : '15'),
                          border: `1px solid ${eventColor}`,
                          borderLeft: isStart || !isMultiDay ? `4px solid ${eventColor}` : `1px solid ${eventColor}`,
                          borderRight: isEnd || !isMultiDay ? `4px solid ${eventColor}` : `1px solid ${eventColor}`,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          position: 'relative',
                          color: '#374151',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = eventColor + '30';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = `0 2px 8px ${eventColor}40`;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = eventColor + (isContinuation ? '25' : '15');
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title={isMultiDay ? `${event.title} (${event.originalStartDate} to ${event.originalEndDate})` : event.title}
                      >
                        {/* Start indicator */}
                        {isStart && isMultiDay && (
                          <span style={{
                            color: eventColor,
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}>
                            ▶
                          </span>
                        )}

                        {/* Continuation indicator */}
                        {isContinuation && (
                          <span style={{
                            color: eventColor,
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}>
                            ▬
                          </span>
                        )}

                        {/* End indicator */}
                        {isEnd && isMultiDay && !isStart && (
                          <span style={{
                            color: eventColor,
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}>
                            ◀
                          </span>
                        )}

                        {/* Event title */}
                        <span style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {getEventChipTitle(event.title)}
                        </span>

                        {/* Recurring event indicator */}
                        {event.is_recurring && (
                          <span title={`Recurring ${event.recurrence_pattern || 'event'}`}>
                            <Repeat
                              size={10}
                              style={{
                                color: eventColor,
                                opacity: 0.8,
                                marginLeft: '2px'
                              }}
                            />
                          </span>
                        )}

                        {/* End arrow for start day */}
                        {isStart && isMultiDay && (
                          <span style={{
                            color: eventColor,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            opacity: 0.7
                          }}>
                            →
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && hoveredDay !== dateKey && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '0.25rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '4px',
                      border: '1px dashed #cbd5e1'
                    }}>
                      +{dayEvents.length - 3} more (hover to see all)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8',
        margin: '2rem 0',
        padding: '1.5rem',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Search Events
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color="#9ca3af"
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'white',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                minHeight: '2.5rem',
                lineHeight: '1.2'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">All Categories</option>
              {categoriesLoading ? (
                <option disabled>Loading categories...</option>
              ) : categoriesError ? (
                <option disabled>Error loading categories</option>
              ) : categories && categories.length > 0 ? (
                categories
                  .filter((category: any) =>
                    // Hide holiday categories from dropdown
                    !['Philippine Holidays', 'International Holidays', 'Religious Holidays'].includes(category.name)
                  )
                  .map((category: any) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))
              ) : (
                <option disabled>No categories available</option>
              )}
            </select>
          </div>
          
          {/* I will comment this refresh button because I dont use this for now */}
          {/* <div>
            <button
              onClick={refresh}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s ease',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div> */}
        </div>
      </div>
      
      {/* Event List Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8f5e8',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2d5016',
            margin: 0
          }}>
            Current School Events
            {/* School Year Events {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()} */}
          </h2>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            {/* {filteredEvents.length} school event{filteredEvents.length !== 1 ? 's' : ''} found
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
              Holidays are shown in calendar but not in this list
            </div> */}
          </div>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <RefreshCw size={24} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <CalendarIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No events found for this month</p>
            <button
              onClick={() => handleCreateEvent()}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Create First Event
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {paginatedEvents.map((event) => (
              <div
                key={`unique-event-${event.calendar_id}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 0.5rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {event.title}
                                            {event.is_recurring ? (
                        <span title={`Recurring ${event.recurrence_pattern || 'event'}`}>
                          <Repeat
                            size={16}
                            color="#22c55e"
                          />
                        </span>
                      ) : null}
                      {Boolean((event as any).is_alert) && (
                        <AlertTriangle size={16} color="#ef4444" />
                      )}
                    </h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {event.event_date}
                      </span>
                      {event.end_date && event.end_date !== event.event_date && (
                        <span>→ {event.end_date}</span>
                      )}
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getEventDuration(event)}
                      </span>
                      <span style={{
                        backgroundColor: getEventTypeColor(event),
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {event.category_name || 'Uncategorized'}
                      </span>
                                            {event.is_recurring ? (
                        <span style={{
                          backgroundColor: '#22c55e',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Repeat size={12} />
                          {event.recurrence_pattern || 'Recurring'}
                        </span>
                      ) : null}

                    </div>
                    {event.description && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0.5rem 0 0 0',
                        lineHeight: '1.5'
                      }}>
                        {event.description}
                      </p>
                    )}

                    {/* Reaction and Comment Counts */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginTop: '0.75rem'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        <Heart size={14} />
                        {(event as any).reaction_count || 0} likes
                      </span>
                      {Boolean((event as any).allow_comments) && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          <MessageCircle size={14} />
                          {(event as any).comment_count || 0} comments
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginLeft: '1rem'
                  }}>
                    <button
                      onClick={() => handleEditEvent(event)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Edit event"
                    >
                      <Edit size={16} />
                    </button>

                    {/* I will comment this button because I dont use this for now */}
                    {/* <button
                      onClick={() => Boolean((event as any).is_published)
                        ? handleUnpublishEvent(event.calendar_id)
                        : handlePublishEvent(event.calendar_id)
                      }
                      style={{
                        padding: '0.5rem',
                        backgroundColor: Boolean((event as any).is_published) ? '#fef3c7' : '#dcfce7',
                        color: Boolean((event as any).is_published) ? '#d97706' : '#16a34a',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={Boolean((event as any).is_published) ? 'Unpublish event' : 'Publish event'}
                    >
                      {Boolean((event as any).is_published) ? <Clock size={16} /> : <Send size={16} />}
                    </button> */}

                    <button
                      onClick={() => handleDeleteEvent(event.calendar_id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{
                  borderTop: '1px solid #f3f4f6',
                  paddingTop: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Event Images
                  </div>
                  <EventImages eventId={event.calendar_id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls - Outside the event list container */}
      <PaginationControls />

      {/* Calendar Event Modal */}
      <CalendarEventModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        event={editingEvent}
        selectedDate={selectedDate}
        loading={saving || loading}
      />

      {/* Holiday Management Modal */}
      {showHolidayManagement && (
        <HolidayManagement
          onClose={() => {
            setShowHolidayManagement(false);
            // Refresh calendar events after holiday management
            refresh();
          }}
        />
      )}
    </div>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;