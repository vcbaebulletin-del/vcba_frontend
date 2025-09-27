import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, RotateCcw, Calendar, User, Tag, MapPin, Clock, AlertTriangle, Archive } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { archiveService, ArchivedCalendarEvent, ArchiveFilters, ArchivePagination } from '../../../services/archiveService';

interface ArchivedCalendarEventsProps {
  onRestoreSuccess?: () => void;
}

const ArchivedCalendarEvents: React.FC<ArchivedCalendarEventsProps> = ({ onRestoreSuccess }) => {
  const { isAuthenticated } = useAdminAuth();
  const [events, setEvents] = useState<ArchivedCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Filter and paginate events using useMemo for performance
  const filteredAndPaginatedData = useMemo(() => {
    // First filter the events
    const filtered = searchQuery.trim() === ''
      ? events
      : events.filter(event =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (event.created_by_name && event.created_by_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    // Calculate pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limit);
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = filtered.slice(startIndex, endIndex);

    return {
      events: paginatedEvents,
      totalItems: totalFiltered,
      totalPages,
      currentPage,
      limit
    };
  }, [events, searchQuery, currentPage, limit]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    } else {
      setError('Authentication required to access archived calendar events');
      setLoading(false);
    }
  }, [isAuthenticated]); // Load all data once, like CategoryManagement

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ArchiveFilters = {};
      // Remove server-side search since we're doing client-side filtering

      const pagination: ArchivePagination = {
        page: 1,
        limit: 100, // Use reasonable limit to avoid backend validation errors
        sort_by: 'updated_at',
        sort_order: 'DESC'
      };

      const response = await archiveService.getArchivedCalendarEvents(filters, pagination);

      if (response.success && response.data && response.data.data) {
        setEvents(response.data.data);
      } else {
        setError('Failed to load archived calendar events');
      }
    } catch (error: any) {
      console.error('Error loading archived calendar events:', error);
      console.error('Error details:', error.response?.data || error);
      setError(error.message || 'Failed to load archived calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to restore this calendar event?')) {
      return;
    }

    try {
      setRestoring(eventId);
      const response = await archiveService.restoreCalendarEvent(eventId);
      
      if (response.success) {
        alert('Calendar event restored successfully!');
        await loadEvents();
        onRestoreSuccess?.();
      } else {
        alert('Failed to restore calendar event');
      }
    } catch (error: any) {
      console.error('Error restoring calendar event:', error);
      alert(error.message || 'Failed to restore calendar event');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (!description || description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading archived calendar events...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}
          />
          <input
            type="text"
            placeholder="Search archived calendar events..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div style={{
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          {events.length} archived event{events.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Events List */}
      {!events || events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#f3f4f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Calendar size={24} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
            No archived calendar events found
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {searchQuery ? 'Try adjusting your search terms' : 'No calendar events have been archived yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAndPaginatedData.events && filteredAndPaginatedData.events.map((event) => (
            <div
              key={event.calendar_id}
              style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {event.title}
                    </h3>
                    {event.is_alert ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: '#fef3c7',
                        color: '#d97706',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        <AlertTriangle size={12} />
                        Alert
                      </div>
                    ) : null}
                                        {event.is_recurring ? (
                      <div style={{
                        background: '#e0e7ff',
                        color: '#3730a3',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        Recurring
                      </div>
                    ) : null}
                  </div>
                  
                  {event.description && (
                    <p style={{
                      margin: '0 0 1rem',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      lineHeight: '1.5'
                    }}>
                      {truncateDescription(event.description)}
                    </p>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>
                      <Calendar size={16} color="#10b981" />
                      <span style={{ fontWeight: '500' }}>Event Date:</span>
                      <span>{formatDate(event.event_date)}</span>
                    </div>

                    {event.event_time && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}>
                        <Clock size={16} color="#10b981" />
                        <span style={{ fontWeight: '500' }}>Time:</span>
                        <span>{event.event_time}</span>
                        {event.end_time && <span> - {event.end_time}</span>}
                      </div>
                    )}

                    {event.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#374151'
                      }}>
                        <MapPin size={16} color="#10b981" />
                        <span style={{ fontWeight: '500' }}>Location:</span>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Tag size={12} />
                      <span style={{
                        background: event.category_color,
                        color: 'white',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        fontWeight: '500'
                      }}>
                        {event.category_name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <User size={12} />
                      {event.created_by_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Archive size={12} style={{ color: '#3b82f6' }} />
                      <span style={{ color: '#3b82f6', fontWeight: '500' }}>
                        Archived: {formatDateTime(event.deleted_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginLeft: '1rem'
                }}>
                  <button
                    onClick={() => handleRestore(event.calendar_id)}
                    disabled={restoring === event.calendar_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: restoring === event.calendar_id ? 'not-allowed' : 'pointer',
                      opacity: restoring === event.calendar_id ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (restoring !== event.calendar_id) {
                        e.currentTarget.style.background = '#059669';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (restoring !== event.calendar_id) {
                        e.currentTarget.style.background = '#10b981';
                      }
                    }}
                  >
                    <RotateCcw size={14} />
                    {restoring === event.calendar_id ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rows per page control */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Showing {filteredAndPaginatedData.events.length} of {filteredAndPaginatedData.totalItems} archived events
        </div>
      </div>

      {/* Pagination */}
      {filteredAndPaginatedData.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#f3f4f6' : '#10b981',
              color: currentPage === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{
            padding: '0.5rem 1rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            Page {currentPage} of {filteredAndPaginatedData.totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === filteredAndPaginatedData.totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === filteredAndPaginatedData.totalPages ? '#f3f4f6' : '#10b981',
              color: currentPage === filteredAndPaginatedData.totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: currentPage === filteredAndPaginatedData.totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchivedCalendarEvents;