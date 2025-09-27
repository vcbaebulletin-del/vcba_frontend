import { useState, useCallback, useEffect } from 'react';
import { adminAnnouncementService } from '../services/announcementService';

interface ExistingImage {
  attachment_id: number;
  file_name: string;
  file_path: string;
  file_url: string;
  display_order: number;
  is_primary: boolean;
}

interface UseMultipleImageUploadProps {
  announcementId?: number;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface UseMultipleImageUploadReturn {
  existingImages: ExistingImage[];
  loading: boolean;
  error: string | null;
  uploadImages: (files: File[]) => Promise<void>;
  deleteImage: (attachmentId: number) => Promise<void>;
  updateImageOrder: (imageOrder: { attachment_id: number; display_order: number }[]) => Promise<void>;
  setPrimaryImage: (attachmentId: number) => Promise<void>;
  refreshImages: () => Promise<void>;
  clearError: () => void;
  // New methods for pending operations
  pendingDeletes: number[];
  markForDeletion: (attachmentId: number) => void;
  unmarkForDeletion: (attachmentId: number) => void;
  applyPendingDeletes: () => Promise<void>;
  clearPendingDeletes: () => void;
  // Clear all image state for new announcements
  clearAllImageState: () => void;
}

export const useMultipleImageUpload = ({
  announcementId,
  onSuccess,
  onError
}: UseMultipleImageUploadProps): UseMultipleImageUploadReturn => {
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);

  // Clear existing images when announcementId becomes null (for new announcements)
  useEffect(() => {
    if (!announcementId) {
      console.log('🧹 useMultipleImageUpload - Clearing existing images for new announcement');
      setExistingImages([]);
      setPendingDeletes([]);
      setError(null);
    }
  }, [announcementId]);

  // Use the imported service instance

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear pending deletes
  const clearPendingDeletes = useCallback(() => {
    setPendingDeletes([]);
  }, []);

  // Clear all image-related state (for new announcements)
  const clearAllImageState = useCallback(() => {
    console.log('🧹 useMultipleImageUpload - Clearing all image state');
    setExistingImages([]);
    setPendingDeletes([]);
    setError(null);
    setLoading(false);
  }, []);

  // Mark image for deletion (don't delete immediately)
  const markForDeletion = useCallback((attachmentId: number) => {
    console.log('🔴 Marking image for deletion:', attachmentId);
    setPendingDeletes(prev => {
      if (!prev.includes(attachmentId)) {
        const newPending = [...prev, attachmentId];
        console.log('🔴 Updated pending deletes:', newPending);
        return newPending;
      }
      return prev;
    });
  }, []);

  // Unmark image for deletion
  const unmarkForDeletion = useCallback((attachmentId: number) => {
    console.log('🟢 Unmarking image for deletion:', attachmentId);
    setPendingDeletes(prev => {
      const newPending = prev.filter(id => id !== attachmentId);
      console.log('🟢 Updated pending deletes:', newPending);
      return newPending;
    });
  }, []);

  // Handle API errors
  const handleError = useCallback((err: any, defaultMessage: string) => {
    const errorMessage = err?.response?.data?.message || err?.message || defaultMessage;
    setError(errorMessage);
    onError?.(errorMessage);
  }, [onError]);

  // Refresh images from server
  const refreshImages = useCallback(async () => {
    if (!announcementId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAnnouncementService.getAnnouncementImages(announcementId);
      
      if (response.success && response.data?.images) {
        setExistingImages(response.data.images);
      } else {
        setExistingImages([]);
      }
    } catch (err) {
      handleError(err, 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [announcementId, handleError]);

  // Upload multiple images
  const uploadImages = useCallback(async (files: File[]) => {
    if (!announcementId || files.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await adminAnnouncementService.addAnnouncementImages(announcementId, formData);

      if (response.success) {
        // Directly update state with new images instead of making another API call
        if (response.data?.images) {
          setExistingImages(response.data.images);
        } else {
          // Fallback to refresh if response doesn't include images
          await refreshImages();
        }
        onSuccess?.(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      handleError(err, 'Failed to upload images');
    } finally {
      setLoading(false);
    }
  }, [announcementId, onSuccess, handleError, refreshImages]);

  // Apply pending deletes (called when user clicks Update)
  const applyPendingDeletes = useCallback(async () => {
    if (!announcementId || pendingDeletes.length === 0) {
      return;
    }

    const deletesToApply = [...pendingDeletes]; // Capture current state

    try {
      setLoading(true);
      setError(null);

      // Batch delete all pending images
      const deletePromises = deletesToApply.map(attachmentId =>
        adminAnnouncementService.deleteAnnouncementImage(announcementId, attachmentId)
      );

      const results = await Promise.allSettled(deletePromises);

      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} image(s)`);
      }

      // Update state optimistically - remove deleted images from existingImages
      setExistingImages(prev =>
        prev.filter(img => !deletesToApply.includes(img.attachment_id))
      );

      // Clear pending deletes
      setPendingDeletes([]);

      onSuccess?.(`Successfully deleted ${deletesToApply.length} image(s)`);
    } catch (err) {
      console.error('❌ Error applying pending deletes:', err);
      handleError(err, 'Failed to delete images');
      // Refresh images to ensure consistency
      await refreshImages();
    } finally {
      setLoading(false);
    }
  }, [announcementId, pendingDeletes, onSuccess, handleError, refreshImages]);

  // Delete an image (immediate deletion - kept for backward compatibility)
  const deleteImage = useCallback(async (attachmentId: number) => {
    if (!announcementId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await adminAnnouncementService.deleteAnnouncementImage(announcementId, attachmentId);

      if (response.success) {
        // Remove from local state immediately for better UX
        setExistingImages(prev => prev.filter(img => img.attachment_id !== attachmentId));
        onSuccess?.('Image deleted successfully');
      } else {
        throw new Error(response.message || 'Delete failed');
      }
    } catch (err) {
      handleError(err, 'Failed to delete image');
      // Refresh images to ensure consistency
      const refreshResponse = await adminAnnouncementService.getAnnouncementImages(announcementId);
      if (refreshResponse.success && refreshResponse.data?.images) {
        setExistingImages(refreshResponse.data.images);
      }
    } finally {
      setLoading(false);
    }
  }, [announcementId, onSuccess, handleError]);

  // Update image display order
  const updateImageOrder = useCallback(async (imageOrder: { attachment_id: number; display_order: number }[]) => {
    if (!announcementId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await adminAnnouncementService.updateImageOrder(announcementId, imageOrder);
      
      if (response.success) {
        // Update local state to reflect new order
        setExistingImages(prev => {
          const updated = [...prev];
          imageOrder.forEach(({ attachment_id, display_order }) => {
            const index = updated.findIndex(img => img.attachment_id === attachment_id);
            if (index !== -1) {
              updated[index] = { ...updated[index], display_order };
            }
          });
          return updated.sort((a, b) => a.display_order - b.display_order);
        });
        onSuccess?.('Image order updated successfully');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (err) {
      handleError(err, 'Failed to update image order');
      // Refresh images to ensure consistency
      const refreshResponse = await adminAnnouncementService.getAnnouncementImages(announcementId);
      if (refreshResponse.success && refreshResponse.data?.images) {
        setExistingImages(refreshResponse.data.images);
      }
    } finally {
      setLoading(false);
    }
  }, [announcementId, onSuccess, handleError]);

  // Set primary image
  const setPrimaryImage = useCallback(async (attachmentId: number) => {
    if (!announcementId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await adminAnnouncementService.setPrimaryImage(announcementId, attachmentId);
      
      if (response.success) {
        // Update local state to reflect new primary image
        setExistingImages(prev => prev.map(img => ({
          ...img,
          is_primary: img.attachment_id === attachmentId
        })));
        onSuccess?.('Primary image updated successfully');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (err) {
      handleError(err, 'Failed to set primary image');
      // Refresh images to ensure consistency
      const refreshResponse = await adminAnnouncementService.getAnnouncementImages(announcementId);
      if (refreshResponse.success && refreshResponse.data?.images) {
        setExistingImages(refreshResponse.data.images);
      }
    } finally {
      setLoading(false);
    }
  }, [announcementId, onSuccess, handleError]);

  return {
    existingImages,
    loading,
    error,
    uploadImages,
    deleteImage,
    updateImageOrder,
    setPrimaryImage,
    refreshImages,
    clearError,
    // New pending operations
    pendingDeletes,
    markForDeletion,
    unmarkForDeletion,
    applyPendingDeletes,
    clearPendingDeletes,
    // Clear all image state
    clearAllImageState
  };
};
