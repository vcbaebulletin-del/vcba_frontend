import React, { useState, useEffect, useMemo } from 'react';
import { tvControlService, TVDisplaySettings } from '../../../services/tvControlService';
import { tvContentSelectionService, TVSelectedContent } from '../../../services/tvContentSelectionService';
import { useAnnouncements } from '../../../hooks/useAnnouncements';
import { useCalendar } from '../../../hooks/useCalendar';
import { RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import { now as getCurrentManilaTime } from '../../../utils/timezone';

interface TVContentManagerProps {
  settings: TVDisplaySettings;
}

const TVContentManager: React.FC<TVContentManagerProps> = ({ settings }) => {
  const [contentType, setContentType] = useState<'both' | 'announcements' | 'events'>('both');
  const [selectedContent, setSelectedContent] = useState<TVSelectedContent>(
    tvContentSelectionService.getSelectedContent()
  );

  // Fetch current content - get all non-deleted content
  const {
    announcements,
    refresh: refreshAnnouncements
  } = useAnnouncements({
    page: 1,
    limit: 100, // Increase limit to get more content
    sort_by: 'created_at',
    sort_order: 'DESC'
    // Remove status filter to get all announcements (published, draft, etc.)
  }, true);

  const {
    events,
    refresh: refreshEvents
  } = useCalendar(new Date());

  // Subscribe to TV content selection changes
  useEffect(() => {
    const unsubscribe = tvContentSelectionService.onSelectionChange(setSelectedContent);
    return unsubscribe;
  }, []);

  // Handle individual content selection toggle
  const handleToggleContentSelection = (id: number, type: 'announcement' | 'calendar') => {
    tvContentSelectionService.toggleContentSelection(id, type);
  };

  // Helper function to check if a date/datetime is in the past (expired) in Asia/Manila timezone
  const isExpired = (dateValue: string | null | undefined): boolean => {
    if (!dateValue) return false;

    try {
      const targetDate = new Date(dateValue);
      const currentManilaTime = getCurrentManilaTime();

      // Compare dates in Asia/Manila timezone
      return targetDate < currentManilaTime;
    } catch (error) {
      console.warn('Error parsing date for expiration check:', dateValue, error);
      return false;
    }
  };

  // Helper function to check if an announcement should be excluded
  const isAnnouncementExcluded = (announcement: any): boolean => {
    // Exclude if status is 'archived'
    if (announcement.status === 'archived') return true;

    // Exclude if soft deleted (deleted_at is not null)
    if (announcement.deleted_at !== null && announcement.deleted_at !== undefined) return true;

    // Exclude if visibility_end_at is in the past (expired)
    if (isExpired(announcement.visibility_end_at)) return true;

    return false;
  };

  // Helper function to check if a calendar event should be excluded
  const isCalendarEventExcluded = (event: any): boolean => {
    // Exclude if soft deleted (deleted_at is not null)
    if (event.deleted_at !== null && event.deleted_at !== undefined) return true;

    // Exclude if expired based on end_date or event_date
    const expirationDate = event.end_date || event.event_date;
    if (isExpired(expirationDate)) return true;

    return false;
  };

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
    console.log(`📊 TV Content Manager - Event deduplication: ${events.length} total events → ${uniqueEventsList.length} unique events`);

    return uniqueEventsList;
  }, [events]);



  const handleContentTypeChange = (type: 'both' | 'announcements' | 'events') => {
    setContentType(type);

    // Update TV settings based on content type selection
    tvControlService.updateSettings({
      showAnnouncements: type === 'both' || type === 'announcements',
      showCalendarEvents: type === 'both' || type === 'events'
    });
  };

  const handleRefreshAll = () => {
    refreshAnnouncements();
    refreshEvents();
    tvControlService.refresh();
  };

  const handleClearAll = () => {
    tvContentSelectionService.clearAllSelections();
  };

  // Filter content based on content type selection
  // Apply additional filtering for expired, archived, and soft-deleted content
  const filteredAnnouncements = (contentType === 'events')
    ? [] // Hide announcements when only events are selected
    : announcements
        .filter(announcement => !isAnnouncementExcluded(announcement)) // Exclude expired/archived/deleted
        .slice(0, Math.max(settings.maxAnnouncements, 50));

  // Filter unique events (deduplication prevents multi-day events from appearing multiple times)
  const filteredEvents = (contentType === 'announcements')
    ? [] // Hide events when only announcements are selected
    : uniqueEvents
        .filter(event => !event.is_holiday) // Exclude holidays from TV content selection
        .filter(event => !isCalendarEventExcluded(event)) // Exclude expired/soft-deleted events
        .slice(0, Math.max(settings.maxEvents, 50));

  // Debug logging for content filtering
  React.useEffect(() => {
    const totalAnnouncements = announcements.length;
    const excludedAnnouncements = announcements.filter(isAnnouncementExcluded).length;
    const totalEvents = uniqueEvents.length;
    const excludedEvents = uniqueEvents.filter(event => !event.is_holiday && isCalendarEventExcluded(event)).length;

    console.log(`📊 TV Content Filtering:
      Announcements: ${totalAnnouncements} total → ${totalAnnouncements - excludedAnnouncements} active (${excludedAnnouncements} excluded)
      Events: ${totalEvents} total → ${totalEvents - excludedEvents} active (${excludedEvents} excluded)`);
  }, [announcements, uniqueEvents]);



  return (
    <div>
      {/* Content Type Selection */}
      <div style={{
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={() => handleContentTypeChange('both')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #28a745',
                borderRadius: '8px',
                background: contentType === 'both' ? '#28a745' : 'white',
                color: contentType === 'both' ? 'white' : '#28a745',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              All Contents
            </button>
            <button
              onClick={() => handleContentTypeChange('announcements')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #3498db',
                borderRadius: '8px',
                background: contentType === 'announcements' ? '#3498db' : 'white',
                color: contentType === 'announcements' ? 'white' : '#3498db',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              Announcements Posts Only
            </button>
            <button
              onClick={() => handleContentTypeChange('events')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '2px solid #e74c3c',
                borderRadius: '8px',
                background: contentType === 'events' ? '#e74c3c' : 'white',
                color: contentType === 'events' ? 'white' : '#e74c3c',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              School Event Posts Only
            </button>
          </div>

          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #dc3545',
              borderRadius: '8px',
              background: '#dc3545',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#c82333';
              e.currentTarget.style.borderColor = '#c82333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#dc3545';
              e.currentTarget.style.borderColor = '#dc3545';
            }}
            title="Clear all selected content from TV display"
          >
            <Trash2 size={18} />
            Clear Selection
          </button>
        </div>
      </div>



      {/* Content Preview Section */}
      <div style={{
        marginTop: '3rem',
        display: 'grid',
        gridTemplateColumns: contentType === 'both' ? '1fr 1fr' : '1fr',
        gap: '2rem'
      }}>
        {/* Announcements Preview */}
        {(contentType === 'both' || contentType === 'announcements') && (
          <div>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              margin: '0 0 1.5rem 0',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Announcements Posts ({filteredAnnouncements.length})
            </h3>

            <div style={{
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              background: '#f8f9fa'
            }}>
              {filteredAnnouncements.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  No announcements to display
                </div>
              ) : (
                filteredAnnouncements.map((announcement, index) => (
                  <div key={announcement.announcement_id} style={{
                    background: 'white',
                    margin: '1rem',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {/* Header with title, category, and selection button */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          margin: '0 0 0.5rem 0',
                          color: '#2c3e50',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          lineHeight: '1.4'
                        }}>
                          {announcement.title}
                        </h4>

                        {/* Category and subcategory */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{
                            background: announcement.category_color || '#3498db',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {announcement.category_name || 'Uncategorized'}
                          </span>
                          {announcement.subcategory_name && (
                            <span style={{
                              background: '#6c757d',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}>
                              {announcement.subcategory_name}
                            </span>
                          )}
                          {announcement.is_alert ? (
                            <span style={{
                              background: '#dc3545',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              🚨 ALERT
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* TV Selection Button */}
                        <button
                          onClick={() => handleToggleContentSelection(announcement.announcement_id, 'announcement')}
                          style={{
                            background: selectedContent.announcements.includes(announcement.announcement_id)
                              ? '#4caf50' : '#e9ecef',
                            color: selectedContent.announcements.includes(announcement.announcement_id)
                              ? 'white' : '#6c757d',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            minWidth: '120px',
                            transition: 'all 0.2s ease'
                          }}
                          title={selectedContent.announcements.includes(announcement.announcement_id)
                            ? 'Hide from TV' : 'Show on TV'}
                        >
                          {selectedContent.announcements.includes(announcement.announcement_id)
                            ? <><Eye size={16} /> SHOWING</>
                            : <><EyeOff size={16} /> HIDDEN</>}
                        </button>

                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#17a2b8',
                          minWidth: '2rem',
                          textAlign: 'center'
                        }}>
                          #{index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Content/Description */}
                    <div style={{
                      color: '#495057',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      marginBottom: '1rem'
                    }}>
                      {announcement.content.length > 200
                        ? `${announcement.content.substring(0, 200)}...`
                        : announcement.content
                      }
                    </div>

                    {/* Metadata */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      color: '#6c757d',
                      borderTop: '1px solid #e9ecef',
                      paddingTop: '0.75rem'
                    }}>
                      <div>
                        Posted by: {announcement.author_name || 'Unknown'}
                      </div>
                      <div>
                        {announcement.grade_level ? `Grade ${announcement.grade_level}` : 'All Grades'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Calendar Events Preview */}
        {(contentType === 'both' || contentType === 'events') && (
          <div>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              margin: '0 0 1.5rem 0',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              School Event Posts ({filteredEvents.length})
            </h3>

            <div style={{
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              background: '#f8f9fa'
            }}>
              {filteredEvents.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  No calendar events to display
                </div>
              ) : (
                filteredEvents.map((event, index) => (
                  <div key={event.calendar_id} style={{
                    background: 'white',
                    margin: '1rem',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {/* Header with title, category, and selection button */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          margin: '0 0 0.5rem 0',
                          color: '#2c3e50',
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          lineHeight: '1.4'
                        }}>
                          {event.title}
                        </h4>

                        {/* Category and subcategory */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{
                            background: event.category_color || '#e74c3c',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {event.category_name || 'Uncategorized'}
                          </span>
                          {event.subcategory_name && (
                            <span style={{
                              background: '#6c757d',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}>
                              {event.subcategory_name}
                            </span>
                          )}
                          {event.is_alert ? (
                            <span style={{
                              background: '#dc3545',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              🚨 ALERT
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* TV Selection Button */}
                        <button
                          onClick={() => handleToggleContentSelection(event.calendar_id, 'calendar')}
                          style={{
                            background: selectedContent.calendarEvents.includes(event.calendar_id)
                              ? '#4caf50' : '#e9ecef',
                            color: selectedContent.calendarEvents.includes(event.calendar_id)
                              ? 'white' : '#6c757d',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            minWidth: '120px',
                            transition: 'all 0.2s ease'
                          }}
                          title={selectedContent.calendarEvents.includes(event.calendar_id)
                            ? 'Hide from TV' : 'Show on TV'}
                        >
                          {selectedContent.calendarEvents.includes(event.calendar_id)
                            ? <><Eye size={16} /> SHOWING</>
                            : <><EyeOff size={16} /> HIDDEN</>}
                        </button>

                        <div style={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: '#17a2b8',
                          minWidth: '2rem',
                          textAlign: 'center'
                        }}>
                          #{index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <div style={{
                        color: '#495057',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        marginBottom: '1rem'
                      }}>
                        {event.description.length > 200
                          ? `${event.description.substring(0, 200)}...`
                          : event.description
                        }
                      </div>
                    )}

                    {/* Event Dates */}
                    <div style={{
                      background: '#f8f9fa',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        color: '#495057'
                      }}>
                        <div>
                          <strong>Start:</strong> {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        {event.end_date && (
                          <div>
                            <strong>End:</strong> {new Date(event.end_date).toLocaleDateString()}
                          </div>
                        )}
                        {event.is_recurring ? (
                          <div style={{
                            background: '#17a2b8',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            🔄 {event.recurrence_pattern?.toUpperCase() || 'RECURRING'}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      color: '#6c757d',
                      borderTop: '1px solid #e9ecef',
                      paddingTop: '0.75rem'
                    }}>
                      <div>
                        Created by: {event.created_by_name || 'Unknown'}
                      </div>
                      <div>
                        {event.allow_comments ? '💬 Comments Allowed' : '🚫 No Comments'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVContentManager;