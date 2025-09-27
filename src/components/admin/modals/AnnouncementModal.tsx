import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHierarchicalCategories } from '../../../hooks/useAnnouncements';
import { useMultipleImageUpload } from '../../../hooks/useMultipleImageUpload';
import MultipleImageUpload from '../MultipleImageUpload';
import CascadingCategoryDropdown from '../../common/CascadingCategoryDropdown';
import { createFormData, validateFormFields, announcementValidationRules } from '../../../utils/formUtils';
import type { Announcement, CreateAnnouncementData, UpdateAnnouncementData } from '../../../types/announcement.types';
import { getCurrentDateTimeLocal, formatDateTimeLocal } from '../../../utils/timezone';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAnnouncementData | UpdateAnnouncementData | FormData, applyPendingDeletes?: () => Promise<void>, onComplete?: () => Promise<void>) => Promise<void>;
  announcement?: Announcement | null;
  loading?: boolean;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  announcement,
  loading = false
}) => {
  const { categories, loading: categoriesLoading, error: categoriesError } = useHierarchicalCategories(); // Use public service (categories should be public)

  // Helper function now uses Philippines timezone utility
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    subcategory_id: '',
    status: 'draft' as 'draft' | 'pending' | 'published' | 'scheduled' | 'archived',
    is_pinned: false,
    is_alert: false,
    allow_comments: true,
    allow_sharing: true,
    scheduled_publish_at: '',
    visibility_start_at: getCurrentDateTimeLocal(), // Auto-populate with current date/time in Philippines timezone
    visibility_end_at: ''
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Debug categories loading
  useEffect(() => {
    console.log('🔍 AnnouncementModal - Categories state:', {
      categories: categories?.length || 0,
      categoriesLoading,
      categoriesError,
      categoriesData: categories
    });
  }, [categories, categoriesLoading, categoriesError]);

  // Memoized validation using utility function
  const validationErrors = useMemo(() => {
    return validateFormFields(formData, {
      ...announcementValidationRules,
      custom: {
        ...announcementValidationRules.custom,
        scheduled_publish_at: (value: any) =>
          announcementValidationRules.custom.scheduled_publish_at(value, formData)
      }
    });
  }, [formData]);

  // Multiple image upload hook
  const {
    existingImages,
    loading: imageLoading,
    error: imageError,
    uploadImages,


    setPrimaryImage,
    refreshImages,
    clearError: clearImageError,
    // New pending operations
    pendingDeletes,
    markForDeletion,
    unmarkForDeletion,
    applyPendingDeletes,
    clearPendingDeletes,
    // Clear all image state
    clearAllImageState
  } = useMultipleImageUpload({
    announcementId: announcement?.announcement_id,
    onSuccess: (message) => setSuccessMessage(message),
    onError: (error) => console.error('Image upload error:', error)
  });

  // Comprehensive reset function for new announcements
  const resetModalForNewAnnouncement = useCallback(() => {
    console.log('🧹 Resetting modal for new announcement');

    // Reset form data to initial state
    setFormData({
      title: '',
      content: '',
      category_id: '',
      subcategory_id: '',
      status: 'pending',
      is_pinned: false,
      is_alert: false,
      allow_comments: true,
      allow_sharing: true,
      scheduled_publish_at: '',
      visibility_start_at: getCurrentDateTimeLocal(), // Auto-populate with current date/time in Philippines timezone
      visibility_end_at: ''
    });

    // Clear all images and image-related state
    setSelectedImages([]);

    // Clear all errors and messages
    setErrors({});
    setSuccessMessage(null);

    // Clear image upload related state
    clearImageError();
    clearPendingDeletes();
    clearAllImageState(); // This will clear existing images from previous announcements

    console.log('✅ Modal reset complete - ready for new announcement');
  }, [clearImageError, clearPendingDeletes, clearAllImageState]);

  // Enhanced close handler that ensures everything is cleared
  const handleClose = useCallback(() => {
    console.log('🚪 Closing modal - clearing all data');

    // Reset everything when closing
    resetModalForNewAnnouncement();

    // Call the parent's onClose
    onClose();
  }, [onClose, resetModalForNewAnnouncement]);

  // Initialize form data when announcement changes
  useEffect(() => {
    if (announcement) {
      console.log('📝 Loading announcement for editing:', announcement.announcement_id);
      console.log('📝 Raw boolean values from database:', {
        is_pinned: announcement.is_pinned,
        is_alert: announcement.is_alert,
        allow_comments: announcement.allow_comments,
        allow_sharing: announcement.allow_sharing
      });

      const convertedBooleans = {
        is_pinned: Boolean(announcement.is_pinned),
        is_alert: Boolean(announcement.is_alert),
        allow_comments: Boolean(announcement.allow_comments),
        allow_sharing: Boolean(announcement.allow_sharing)
      };

      console.log('📝 Converted boolean values for form:', convertedBooleans);

      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        category_id: announcement.category_id?.toString() || '',
        subcategory_id: announcement.subcategory_id?.toString() || '',
        status: announcement.status || 'pending',
        is_pinned: convertedBooleans.is_pinned,
        is_alert: convertedBooleans.is_alert,
        allow_comments: convertedBooleans.allow_comments,
        allow_sharing: convertedBooleans.allow_sharing,
        scheduled_publish_at: announcement.scheduled_publish_at || '',
        visibility_start_at: announcement.visibility_start_at ? formatDateTimeLocal(announcement.visibility_start_at) : getCurrentDateTimeLocal(), // Use existing or current date/time in Philippines timezone
        visibility_end_at: announcement.visibility_end_at || ''
      });
      // Clear selected images for editing
      setSelectedImages([]);

      // Load existing images for editing
      if (announcement.announcement_id) {
        refreshImages();
      }
    } else if (isOpen) {
      // Modal is open for creating new announcement
      console.log('🆕 Modal opened for new announcement - resetting all data');
      resetModalForNewAnnouncement();
    }

    // Always clear errors and messages when modal state changes
    setErrors({});
    setSuccessMessage(null);
    clearImageError();
    clearPendingDeletes(); // Clear any pending deletions when modal opens/closes
  }, [announcement?.announcement_id, isOpen, clearImageError, clearPendingDeletes, resetModalForNewAnnouncement]);

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

  // Optimized validation using memoized errors
  const validateForm = useCallback((): boolean => {
    const newErrors = { ...validationErrors };

    // Add additional validation rules
    if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationErrors, formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Create completion callback for additional operations
      const onComplete = async () => {
        // If we're editing and have images, upload them separately
        if (announcement && selectedImages.length > 0) {
          try {
            await uploadImages(selectedImages);
            setSelectedImages([]); // Clear selected images after upload
          } catch (uploadError) {
            console.error('Error uploading additional images:', uploadError);
            // Don't throw here as the main announcement was saved successfully
          }
        }

        // Refresh images to show updates immediately
        if (announcement?.announcement_id) {
          await refreshImages();
        }

        // Clear pending deletes after successful update
        clearPendingDeletes();
      };

      // Debug logging for form submission
      console.log('🧪 Form submission data:', {
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        title: formData.title,
        status: formData.status,
        is_pinned: formData.is_pinned,
        is_alert: formData.is_alert,
        allow_comments: formData.allow_comments,
        allow_sharing: formData.allow_sharing
      });

      // Determine if we need to send FormData (for files) or JSON (for text-only)
      const hasFiles = selectedImages.length > 0;

      let dataToSubmit: FormData | object;

      if (hasFiles) {
        // Create FormData for file uploads
        dataToSubmit = createFormData(formData, selectedImages);
        console.log('📤 Submitting with FormData (has files):', {
          isEditing: !!announcement,
          formData,
          selectedImagesCount: selectedImages.length
        });

        console.log('📋 FormData entries being sent:');
        const formDataEntries: string[] = [];
        (dataToSubmit as FormData).forEach((value, key) => {
          formDataEntries.push(`  ${key}: ${value} (${typeof value})`);
        });
        console.log(formDataEntries.join('\n'));
      } else {
        // Send as JSON for text-only updates
        dataToSubmit = {
          title: formData.title?.trim(),
          content: formData.content?.trim(),
          category_id: parseInt(formData.category_id),
          subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
          status: formData.status,
          is_pinned: formData.is_pinned,
          is_alert: formData.is_alert,
          allow_comments: formData.allow_comments,
          allow_sharing: formData.allow_sharing,
          scheduled_publish_at: formData.status === 'scheduled' && formData.scheduled_publish_at ? formData.scheduled_publish_at : null,
          visibility_start_at: formData.visibility_start_at || null,
          visibility_end_at: formData.visibility_end_at || null
        };

        console.log('📤 Submitting with JSON (no files):', {
          isEditing: !!announcement,
          dataToSubmit
        });
      }

      // Call onSave with completion callback - parent will handle modal closing and success message
      await onSave(
        dataToSubmit,
        pendingDeletes.length > 0 ? applyPendingDeletes : undefined,
        onComplete
      );

      // Parent component will handle:
      // 1. Executing onComplete (image uploads)
      // 2. Refreshing announcements list
      // 3. Closing modal
      // 4. Showing success message
    } catch (error) {
      console.error('Error saving announcement:', error);
      setErrors({ submit: 'Failed to save announcement. Please try again.' });
    }
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: number | null) => {
    console.log('🧪 AnnouncementModal - Category changed:', categoryId);
    console.log('🧪 AnnouncementModal - Available categories:', categories?.map(cat => ({ id: cat.category_id, name: cat.name })));
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
    console.log('🧪 Subcategory changed:', subcategoryId);
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
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Fixed Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem 2rem 0 2rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2d5016',
            margin: 0
          }}>
            {announcement ? 'Edit Announcement' : 'Create New Announcement'}
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

        {/* Scrollable Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 2rem'
        }}>
          <form id="announcement-form" onSubmit={handleSubmit}>
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
              placeholder="Enter announcement title"
            />
            {errors.title && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.title}
              </p>
            )}
          </div>

          {/* Content */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.content ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                resize: 'vertical'
              }}
              placeholder="Enter announcement content"
            />
            {errors.content && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.content}
              </p>
            )}
          </div>

          {/* Category and Status Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Category */}
            <div>
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
                    // Hide holiday categories from announcement creation/editing
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

            {/* Status */}
            {/* <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div> */}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              ✓ {successMessage}
            </div>
          )}



          {/* Image Upload */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '16px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                Images
              </h4>
              {pendingDeletes.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  <span>⚠️</span>
                  {pendingDeletes.length} image{pendingDeletes.length > 1 ? 's' : ''} will be deleted
                </div>
              )}
            </div>
            <MultipleImageUpload
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

          {/* Scheduled Publish Date (only show if status is scheduled) */}
          {formData.status === 'scheduled' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Scheduled Publish Date *
              </label>
              <input
                type="datetime-local"
                name="scheduled_publish_at"
                value={formData.scheduled_publish_at}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.scheduled_publish_at ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {errors.scheduled_publish_at && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  {errors.scheduled_publish_at}
                </p>
              )}
            </div>
          )}

          {/* Visibility Date Range */}
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 1rem 0'
            }}>
              Visibility Schedule (Optional)
            </h4>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: '0 0 1rem 0',
              lineHeight: '1.4'
            }}>
              Set when this announcement should be visible to users. Leave empty for always visible.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              {/* Visibility Start Date */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Start Date & Time <span style={{ color: '#6b7280', fontWeight: '400' }}>(Auto-populated)</span>
                </label>
                <input
                  type="datetime-local"
                  name="visibility_start_at"
                  value={formData.visibility_start_at}
                  onChange={handleInputChange}
                  disabled={true} // Make the start date read-only
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.visibility_start_at ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#f9fafb', // Light gray background to indicate disabled state
                    color: '#6b7280', // Muted text color
                    cursor: 'not-allowed'
                  }}
                />
                {errors.visibility_start_at && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.visibility_start_at}
                  </p>
                )}
              </div>

              {/* Visibility End Date */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="visibility_end_at"
                  value={formData.visibility_end_at}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.visibility_end_at ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                {errors.visibility_end_at && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.visibility_end_at}
                  </p>
                )}
              </div>
            </div>

            {/* Validation message for date range */}
            {formData.visibility_start_at && formData.visibility_end_at &&
             new Date(formData.visibility_start_at) >= new Date(formData.visibility_end_at) && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '0.75rem'
              }}>
                ⚠️ End date must be after start date
              </div>
            )}
          </div>

          {/* Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>

            {/* I dont use the pin so I comment it */}
            {/* <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Pin this announcement
              </label>
            </div> */}
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
            {/* I will comment "Allow sharing" for the mean time and I will uncomment this in the future */}
            {/* <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="allow_sharing"
                  checked={formData.allow_sharing}
                  onChange={handleInputChange}
                  style={{ marginRight: '0.5rem' }}
                />
                Allow sharing
              </label>
            </div> */}
          </div>

          </form>
        </div>

        {/* Fixed Footer */}
        <div style={{
          padding: '1.5rem 2rem 2rem 2rem',
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
              form="announcement-form"
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
              {loading ? 'Saving...' : (announcement ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;