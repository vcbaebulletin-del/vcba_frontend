import React, { useState, useEffect, useCallback } from 'react';
import { useCalendarCategories } from '../../../hooks/useCalendar';
import { useCalendarImageUpload } from '../../../hooks/useCalendarImageUpload';
import CalendarImageUpload from '../CalendarImageUpload';
import CascadingCategoryDropdown from '../../common/CascadingCategoryDropdown';
import type { CalendarEvent, CreateEventData, UpdateEventData } from '../../../types/calendar.types';
import { calendarService } from '../../../services/calendarService';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateEventData | UpdateEventData, applyPendingDeletes?: () => Promise<void>, onComplete?: () => Promise<void>) => Promise<void>;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
  loading?: boolean;
}

const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  selectedDate,
  loading = false
}) => {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCalendarCategories(); // Use calendar service for categories
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    category_id: '',
    subcategory_id: '',
    is_recurring: false,
    recurrence_pattern: '' as '' | 'yearly' | 'monthly' | 'weekly',
    is_active: true,
    is_published: false,
    allow_comments: true,
    is_alert: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if the current event is a holiday
  const isHoliday = ['Philippine Holidays', 'International Holidays', 'Religious Holidays'].includes(event?.category_name || '') ||
    event?.is_holiday;

  // Debug categories loading
  useEffect(() => {
    console.log('🔍 CalendarEventModal - Categories state:', {
      categories: categories?.length || 0,
      categoriesLoading,
      categoriesError,
      categoriesData: categories
    });
  }, [categories, categoriesLoading, categoriesError]);

  // Image upload hook
  const {
    existingImages,
    loading: imageLoading,
    error: imageError,
    uploadImages,
    setPrimaryImage,
    refreshImages,
    clearError: clearImageError,
    // Pending operations
    pendingDeletes,
    markForDeletion,
    unmarkForDeletion,
    applyPendingDeletes,
    clearPendingDeletes,
    // Clear all image state
    clearAllImageState
  } = useCalendarImageUpload({
    calendarId: event?.calendar_id,
    onSuccess: (message) => setSuccessMessage(message),
    onError: (error) => setErrorMessage(error)
  });

  // Initialize form data when event or selectedDate changes
  useEffect(() => {
    if (event) {
      // Helper function to extract date part without timezone issues
      const extractDatePart = (dateString: string) => {
        if (!dateString) return '';
        // If it's already in YYYY-MM-DD format, return as-is
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        // Otherwise, extract the date part from ISO string
        return dateString.split('T')[0];
      };

      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_date: extractDatePart(event.event_date),
        end_date: event.end_date ? extractDatePart(event.end_date) : '',
        // Use category_id/subcategory_id if available, otherwise leave empty for manual selection
        category_id: event.category_id?.toString() || '',
        subcategory_id: event.subcategory_id?.toString() || '',
        is_recurring: event.is_recurring || false,
        recurrence_pattern: event.recurrence_pattern || '',
        is_active: event.is_active !== false,
        is_published: (event as any).is_published || false,
        allow_comments: Boolean((event as any).allow_comments),
        is_alert: (event as any).is_alert || false
      });
    } else {
      // Format selected date properly to avoid timezone issues
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const dateString = selectedDate ? formatLocalDate(selectedDate) : '';
      setFormData({
        title: '',
        description: '',
        event_date: dateString,
        end_date: '',
        category_id: '',
        subcategory_id: '',
        is_recurring: false,
        recurrence_pattern: '',
        is_active: true,
        is_published: false,
        allow_comments: true,
        is_alert: false
      });

      // Clear image state for new events
      clearAllImageState();
      setSelectedImages([]);
    }
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    clearImageError();
  }, [event, selectedDate, clearImageError, clearAllImageState]);

  // Separate effect to handle modal open/close state
  useEffect(() => {
    if (!isOpen) {
      // Clear pending deletes when modal closes
      clearPendingDeletes();
    }
  }, [isOpen, clearPendingDeletes]);

  // Enhanced close handler that ensures everything is cleared
  const handleClose = useCallback(() => {
    console.log('🚪 Closing calendar modal - clearing all data');

    // Clear pending deletes before closing
    clearPendingDeletes();

    // Clear other state
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
    clearImageError();

    // Call parent's onClose
    onClose();
  }, [clearPendingDeletes, clearImageError, onClose]);

  // Handle Escape key to close modal and clear data
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleClose]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (formData.end_date && formData.event_date && formData.end_date < formData.event_date) {
      newErrors.end_date = 'End date cannot be before start date';
    }

    if (formData.is_recurring && !formData.recurrence_pattern) {
      newErrors.recurrence_pattern = 'Recurrence pattern is required for recurring events';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Format dates to ensure they're sent as local dates without timezone conversion
      const formatDateForSubmission = (dateString: string) => {
        if (!dateString) return undefined;
        // Simply return the date string as-is if it's already in YYYY-MM-DD format
        // This prevents any timezone conversion issues
        return dateString;
      };

      // Build submit data with only the fields that should be updated
      const submitData: any = {};

      // Always include basic fields that are being edited
      if (formData.title !== undefined) submitData.title = formData.title;
      if (formData.description !== undefined) submitData.description = formData.description;
      if (formData.event_date !== undefined) submitData.event_date = formatDateForSubmission(formData.event_date);
      if (formData.category_id !== undefined) submitData.category_id = parseInt(formData.category_id);

      // Only include subcategory_id if it has a valid value
      if (formData.subcategory_id && formData.subcategory_id !== '' && formData.subcategory_id !== '0') {
        submitData.subcategory_id = parseInt(formData.subcategory_id);
      }

      // Only include end_date if it has a value
      if (formData.end_date && formData.end_date !== '') {
        submitData.end_date = formatDateForSubmission(formData.end_date);
      }

      // Include boolean fields (but skip recurring fields for holidays as they shouldn't change)
      if (!isHoliday && formData.is_recurring !== undefined) submitData.is_recurring = Boolean(formData.is_recurring);
      if (formData.is_active !== undefined) submitData.is_active = Boolean(formData.is_active);
      if (formData.is_published !== undefined) submitData.is_published = Boolean(formData.is_published);
      if (formData.allow_comments !== undefined) submitData.allow_comments = Boolean(formData.allow_comments);
      if (formData.is_alert !== undefined) submitData.is_alert = Boolean(formData.is_alert);

      // Only include recurrence_pattern for non-holidays (holidays should keep their yearly pattern)
      if (!isHoliday && formData.is_recurring && formData.recurrence_pattern) {
        submitData.recurrence_pattern = formData.recurrence_pattern as 'yearly' | 'monthly' | 'weekly';
      }

      // Create completion callback for additional operations
      const onComplete = async (createdEventId?: number) => {
        // Upload images if we have any selected (works for both create and edit modes)
        if (selectedImages.length > 0) {
          try {
            // For create mode, we need the newly created event ID
            // For edit mode, we use the existing event's calendar_id
            const eventIdForUpload = createdEventId || event?.calendar_id;

            if (eventIdForUpload) {
              console.log(`📤 Uploading ${selectedImages.length} images for event ${eventIdForUpload}`);

              // Temporarily update the calendarId in the hook to enable upload
              // This is needed for create mode where the hook was initialized with undefined calendarId
              if (createdEventId && !event) {
                // For new events, we need to trigger a re-upload with the new ID
                // We'll use the calendarService directly since the hook's calendarId is still undefined
                const formData = new FormData();
                selectedImages.forEach((file) => {
                  formData.append('images', file);
                });

                const response = await calendarService.uploadEventAttachments(createdEventId, formData);
                if (response.success) {
                  console.log(`✅ Successfully uploaded ${selectedImages.length} images for new event`);
                  setSuccessMessage(`Event created and ${selectedImages.length} image(s) uploaded successfully!`);
                } else {
                  console.error('❌ Failed to upload images for new event:', response.message);
                  setErrorMessage(`Event created but failed to upload images: ${response.message}`);
                }
              } else {
                // For edit mode, use the existing hook function
                await uploadImages(selectedImages);
              }

              setSelectedImages([]); // Clear selected images after upload
            } else {
              console.warn('⚠️ No event ID available for image upload');
            }
          } catch (uploadError) {
            console.error('❌ Error uploading images:', uploadError);
            const errorMsg = uploadError instanceof Error ? uploadError.message : 'Failed to upload images';
            if (event) {
              // Edit mode - don't throw as the main event was saved successfully
              setErrorMessage(`Event updated but failed to upload images: ${errorMsg}`);
            } else {
              // Create mode - still don't throw as the event was created successfully
              setErrorMessage(`Event created but failed to upload images: ${errorMsg}`);
            }
          }
        }

        // Refresh images to show updates immediately (only for edit mode)
        if (event?.calendar_id) {
          await refreshImages();
        }

        // Clear pending deletes after successful update
        clearPendingDeletes();
      };

      console.log('🚀 Submitting calendar event:', submitData); // Debug log
      console.log('📋 Data types check:', {
        title: typeof submitData.title,
        description: typeof submitData.description,
        event_date: typeof submitData.event_date,
        category_id: typeof submitData.category_id,
        subcategory_id: typeof submitData.subcategory_id,
        is_recurring: typeof submitData.is_recurring,
        recurrence_pattern: typeof submitData.recurrence_pattern,
        is_active: typeof submitData.is_active,
        is_published: typeof submitData.is_published,
        allow_comments: typeof submitData.allow_comments,
        is_alert: typeof submitData.is_alert
      });
      console.log('📋 Pending deletes before save:', pendingDeletes);

      await onSave(
        submitData,
        pendingDeletes.length > 0 ? applyPendingDeletes : undefined,
        onComplete
      );
      handleClose();
    } catch (error) {
      console.error('❌ Error saving event:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText
      });
    }
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: number | null) => {
    console.log('🧪 CalendarEventModal - Category changed:', categoryId);
    console.log('🧪 CalendarEventModal - Available categories:', categories?.map(cat => ({ id: cat.category_id, name: cat.name })));
    setFormData(prev => ({
      ...prev,
      category_id: categoryId?.toString() || '',
      subcategory_id: '' // Clear subcategory when category changes
    }));

    // Clear category error
    if (errors.category_id) {
      setErrors(prev => ({ ...prev, category_id: '' }));
    }
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (subcategoryId: number | null) => {
    console.log('🧪 CalendarEventModal - Subcategory changed:', subcategoryId);
    setFormData(prev => ({
      ...prev,
      subcategory_id: subcategoryId?.toString() || ''
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Fixed Header */}
        <div style={{
          padding: '2rem 2rem 0 2rem',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#2d5016',
              margin: 0
            }}>
              {isHoliday ? 'Holiday Details' : (event ? 'Edit Event' : 'Create New Event')}
              {/* I will comment this because I dont use this for now */}
              {/* {isHoliday && (
                <span style={{
                  marginLeft: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  borderRadius: '4px',
                  border: '1px solid #bfdbfe'
                }}>
                  Holiday
                </span>
              )} */}
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0.25rem'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 2rem'
        }}>

        {/* Conditional rendering based on whether it's a holiday */}
        {isHoliday ? (
          // Holiday View - Show title (read-only), editable description, and editable image
          <form onSubmit={handleSubmit}>
            {/* Holiday Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#2d5016',
                margin: '0 0 0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: event?.category_color || '#22c55e'
                }}></span>
                {event?.title}
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>{event?.category_name}</span>
                {event?.event_date && (
                  <>
                    <span>•</span>
                    <span>{new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </>
                )}
                {event?.is_recurring && (
                  <>
                    <span>•</span>
                    <span style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      Recurring {event.recurrence_pattern}
                    </span>
                  </>
                )}
                {(event as any)?.is_recurring_instance && (
                  <>
                    <span>•</span>
                    <span style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      Recurring Instance
                    </span>
                  </>
                )}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.5rem',
                fontStyle: 'italic'
              }}>
                Holiday name and date cannot be changed. You can edit the description and add images.
              </div>
            </div>

            {/* Holiday Description - Editable */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Description
                <span style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: '400',
                  marginLeft: '0.5rem'
                }}>
                  (You can add local context or additional information)
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical'
                }}
                placeholder="Add description, local context, or additional information about this holiday..."
              />
            </div>

            {/* Holiday Image - Editable */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Event Images
                <span style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: '400',
                  marginLeft: '0.5rem'
                }}>
                  (Add images to make this holiday more engaging)
                </span>
              </label>
              {pendingDeletes.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  marginBottom: '0.75rem',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  <span>⚠️</span>
                  {pendingDeletes.length} image{pendingDeletes.length > 1 ? 's' : ''} will be deleted
                </div>
              )}
              <CalendarImageUpload
                onImagesChange={setSelectedImages}
                existingImages={existingImages}
                onSetPrimary={setPrimaryImage}
                maxImages={10}
                onMarkForDeletion={markForDeletion}
                onUnmarkForDeletion={unmarkForDeletion}
                pendingDeletes={pendingDeletes}
                disabled={loading}
              />
            </div>

            {/* Action Buttons for Holiday View */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
              gap: '1rem'
            }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          // Regular Event Form
          <form id="calendar-event-form" onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.title ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Recurring Event Information */}
          {(event?.is_recurring || (event as any)?.is_recurring_instance) && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#0369a1'
                }}>
                  📅 Recurring Event Information
                </span>
              </div>
              {event?.is_recurring && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#0369a1',
                  marginBottom: '0.25rem'
                }}>
                  <strong>Pattern:</strong> This event repeats {event.recurrence_pattern}
                </div>
              )}
              {(event as any)?.is_recurring_instance && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#0369a1',
                  marginBottom: '0.25rem'
                }}>
                  <strong>Instance:</strong> This is a recurring instance of event #{(event as any).original_event_id}
                </div>
              )}
              <div style={{
                fontSize: '0.75rem',
                color: '#0369a1',
                fontStyle: 'italic'
              }}>
                {event?.is_recurring
                  ? 'Changes to this event will affect all future occurrences.'
                  : 'Changes to this instance will only affect this specific occurrence.'
                }
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                resize: 'vertical'
              }}
              placeholder="Enter event description (optional)"
            />
          </div>

          {/* Date Range */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Start Date */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Start Date *
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.event_date ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {errors.event_date && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.event_date}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.end_date ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {errors.end_date && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.end_date}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Category *
            </label>
            {categoriesError ? (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.375rem',
                color: '#dc2626',
                fontSize: '0.875rem'
              }}>
                Error loading categories: {categoriesError}
                <br />
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Reload Page
                </button>
              </div>
            ) : categoriesLoading ? (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.375rem',
                color: '#0369a1',
                fontSize: '0.875rem'
              }}>
                Loading categories...
              </div>
            ) : !categories || categories.length === 0 ? (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '0.375rem',
                color: '#ea580c',
                fontSize: '0.875rem'
              }}>
                No categories available. Please contact administrator.
              </div>
            ) : (
              <CascadingCategoryDropdown
                categories={categories?.filter(category =>
                  // Hide holiday categories from event creation/editing
                  !['Philippine Holidays', 'International Holidays', 'Religious Holidays'].includes(category.name)
                )}
                selectedCategoryId={formData.category_id ? parseInt(formData.category_id) : undefined}
                selectedSubcategoryId={formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined}
                onCategoryChange={handleCategoryChange}
                onSubcategoryChange={handleSubcategoryChange}
                placeholder="Select Category"
                required={true}
                error={errors.category_id}
                disabled={loading}
              />
            )}
          </div>

          {/* Recurring Options */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#374151',
              cursor: 'pointer',
              marginBottom: '0.5rem'
            }}>
              <input
                type="checkbox"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleInputChange}
                style={{ marginRight: '0.5rem' }}
              />
              Recurring Event
            </label>

            {formData.is_recurring && (
              <select
                name="recurrence_pattern"
                value={formData.recurrence_pattern}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.recurrence_pattern ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select Recurrence Pattern</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
            {errors.recurrence_pattern && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.recurrence_pattern}
              </p>
            )}
          </div>

          {/* Event Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Active Event
              </label>
            </div>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="allow_comments"
                  checked={formData.allow_comments}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Allow comments
              </label>
            </div>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="is_alert"
                  checked={formData.is_alert}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Mark as alert
              </label>
            </div>
          </div>

          {/* Image Upload Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                margin: 0
              }}>
                Event Images
              </h4>
              {pendingDeletes.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  marginTop: '0.5rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  <span>⚠️</span>
                  {pendingDeletes.length} image{pendingDeletes.length > 1 ? 's' : ''} will be deleted
                </div>
              )}
            </div>
            <CalendarImageUpload
              onImagesChange={setSelectedImages}
              existingImages={existingImages}
              onSetPrimary={setPrimaryImage}
              maxImages={10}
              disabled={imageLoading}
              pendingDeletes={pendingDeletes}
              onMarkForDeletion={markForDeletion}
              onUnmarkForDeletion={unmarkForDeletion}
            />
            {imageError && (
              <div style={{
                color: '#dc2626',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {imageError}
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#15803d',
              fontSize: '0.875rem'
            }}>
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {errorMessage}
            </div>
          )}
        </form>
        )}
        </div>

        {/* Fixed Footer - only show for regular events, holidays have their own footer */}
        {!isHoliday && (
          <div style={{
            padding: '1rem 2rem 2rem 2rem',
            flexShrink: 0,
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                form="calendar-event-form"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                {loading ? 'Saving...' : (event ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarEventModal;