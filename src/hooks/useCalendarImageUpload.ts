import { useState, useCallback, useEffect } from 'react';
import { calendarService } from '../services/calendarService';

export interface CalendarAttachment {
  attachment_id: number;
  calendar_id: number;
  file_name: string;
  file_path: string;
  file_url?: string;
  file_type: 'image' | 'video' | 'document';
  file_size: number;
  mime_type: string;
  display_order: number;
  is_primary: boolean;
  uploaded_at: string;
  deleted_at?: string | null;
}

interface UseCalendarImageUploadProps {
  calendarId?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface UseCalendarImageUploadReturn {
  existingImages: CalendarAttachment[];
  loading: boolean;
  error: string | null;
  uploadImages: (files: File[]) => Promise<void>;
  deleteImage: (attachmentId: number) => Promise<void>;
  setPrimaryImage: (attachmentId: number) => Promise<void>;
  refreshImages: () => Promise<void>;
  clearError: () => void;
  // Pending operations for soft deletion
  pendingDeletes: number[];
  markForDeletion: (attachmentId: number) => void;
  unmarkForDeletion: (attachmentId: number) => void;
  applyPendingDeletes: () => Promise<void>;
  clearPendingDeletes: () => void;
  // Clear all image state
  clearAllImageState: () => void;
}

export const useCalendarImageUpload = ({
  calendarId,
  onSuccess,
  onError
}: UseCalendarImageUploadProps): UseCalendarImageUploadReturn => {
  const [existingImages, setExistingImages] = useState<CalendarAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);

  // Clear existing images when calendarId becomes null (for new events)
  useEffect(() => {
    if (!calendarId) {
      // console.log('🧹 useCalendarImageUpload - Clearing existing images for new event');
      setExistingImages([]);
      setPendingDeletes([]);
      setError(null);
    }
  }, [calendarId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear pending deletes
  const clearPendingDeletes = useCallback(() => {
    setPendingDeletes([]);
  }, []);

  // Clear all image-related state (for new events)
  const clearAllImageState = useCallback(() => {
    // console.log('🧹 useCalendarImageUpload - Clearing all image state');
    setExistingImages([]);
    setPendingDeletes([]);
    setError(null);
    setLoading(false);
  }, []);

  // Fetch existing images for the calendar event
  const refreshImages = useCallback(async () => {
    if (!calendarId) {
      setExistingImages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // console.log(`📸 Fetching images for calendar event ${calendarId}`);
      const response = await calendarService.getEventAttachments(calendarId);

      if (response.success && response.data) {
        const images = response.data.attachments || [];
        // console.log(`✅ Found ${images.length} images for calendar event ${calendarId}`);

        // Add file_url for display using the same approach as announcements
        const imagesWithUrls = images.map((img: CalendarAttachment) => {
          // Use the same getImageUrl function that announcements use
          const { getImageUrl } = require('../config/constants');
          const file_url = getImageUrl(img.file_path);

          return {
            ...img,
            file_url
          };
        });

        setExistingImages(imagesWithUrls);
      } else {
        throw new Error(response.message || 'Failed to fetch calendar images');
      }
    } catch (err: any) {
      console.error('❌ Error fetching calendar images:', err);
      const errorMessage = err.message || 'Failed to fetch calendar images';
      setError(errorMessage);
      // Call onError if it exists, but don't include it in dependencies to prevent infinite loop
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [calendarId]); // Remove onError from dependencies to prevent infinite loop

  // Upload new images
  const uploadImages = useCallback(async (files: File[]) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required for image upload');
    }

    if (!files || files.length === 0) {
      throw new Error('No files selected for upload');
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`📤 Uploading ${files.length} images for calendar event ${calendarId}`);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await calendarService.uploadEventAttachments(calendarId, formData);

      if (response.success) {
        console.log(`✅ Successfully uploaded ${files.length} images`);
        if (onSuccess) {
          onSuccess(`Successfully uploaded ${files.length} image(s)`);
        }
        await refreshImages(); // Refresh to show new images
      } else {
        throw new Error(response.message || 'Failed to upload images');
      }
    } catch (err: any) {
      console.error('❌ Error uploading calendar images:', err);
      const errorMessage = err.message || 'Failed to upload images';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, refreshImages]); // Remove onSuccess and onError from dependencies

  // Delete image
  const deleteImage = useCallback(async (attachmentId: number) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🗑️ Deleting calendar image ${attachmentId}`);
      const response = await calendarService.deleteEventAttachment(attachmentId);

      if (response.success) {
        console.log(`✅ Successfully deleted calendar image ${attachmentId}`);
        if (onSuccess) {
          onSuccess('Image deleted successfully');
        }
        await refreshImages(); // Refresh to remove deleted image
      } else {
        throw new Error(response.message || 'Failed to delete image');
      }
    } catch (err: any) {
      console.error('❌ Error deleting calendar image:', err);
      const errorMessage = err.message || 'Failed to delete image';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshImages]); // Remove onSuccess and onError from dependencies

  // Set primary image
  const setPrimaryImage = useCallback(async (attachmentId: number) => {
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`⭐ Setting calendar image ${attachmentId} as primary`);
      const response = await calendarService.setPrimaryAttachment(calendarId, attachmentId);

      if (response.success) {
        console.log(`✅ Successfully set calendar image ${attachmentId} as primary`);
        if (onSuccess) {
          onSuccess('Primary image updated successfully');
        }
        await refreshImages(); // Refresh to show updated primary status
      } else {
        throw new Error(response.message || 'Failed to set primary image');
      }
    } catch (err: any) {
      console.error('❌ Error setting primary calendar image:', err);
      const errorMessage = err.message || 'Failed to set primary image';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarId, refreshImages]); // Remove onSuccess and onError from dependencies

  // Mark image for deletion (pending)
  const markForDeletion = useCallback((attachmentId: number) => {
    console.log('🏷️ Marking calendar image for deletion:', attachmentId);
    setPendingDeletes(prev => {
      if (!prev.includes(attachmentId)) {
        const newPending = [...prev, attachmentId];
        console.log('📋 Pending deletes updated:', newPending);
        return newPending;
      }
      return prev;
    });
  }, []);

  // Unmark image for deletion
  const unmarkForDeletion = useCallback((attachmentId: number) => {
    console.log('🔄 Unmarking calendar image for deletion:', attachmentId);
    setPendingDeletes(prev => {
      const newPending = prev.filter(id => id !== attachmentId);
      console.log('📋 Updated pending deletes:', newPending);
      return newPending;
    });
  }, []);

  // Apply pending deletions
  const applyPendingDeletes = useCallback(async () => {
    if (pendingDeletes.length === 0) return;

    try {
      console.log(`🗑️ Applying ${pendingDeletes.length} pending calendar image deletions`);

      // Delete images directly without calling deleteImage to avoid dependency issues
      for (const attachmentId of pendingDeletes) {
        try {
          setLoading(true);
          console.log(`🗑️ Deleting calendar image ${attachmentId}`);
          const response = await calendarService.deleteEventAttachment(attachmentId);

          if (response.success) {
            console.log(`✅ Successfully deleted calendar image ${attachmentId}`);
          } else {
            throw new Error(response.message || 'Failed to delete image');
          }
        } catch (err: any) {
          console.error('❌ Error deleting calendar image:', err);
          throw err;
        }
      }

      setPendingDeletes([]);
      // Call refreshImages directly without including it in dependencies
      refreshImages();
      console.log('✅ All pending calendar image deletions applied');
    } catch (err: any) {
      console.error('❌ Error applying pending calendar image deletions:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pendingDeletes]); // Remove refreshImages from dependencies to prevent infinite loop

  // Fetch images when calendarId changes
  useEffect(() => {
    if (calendarId) {
      refreshImages();
    }
  }, [calendarId]); // Remove refreshImages from dependency array to prevent infinite loop

  return {
    existingImages,
    loading,
    error,
    uploadImages,
    deleteImage,
    setPrimaryImage,
    refreshImages,
    clearError,
    pendingDeletes,
    markForDeletion,
    unmarkForDeletion,
    applyPendingDeletes,
    clearPendingDeletes,
    clearAllImageState
  };
};
