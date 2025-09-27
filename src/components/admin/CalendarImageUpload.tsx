import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { CalendarAttachment } from '../../hooks/useCalendarImageUpload';
import { getImageUrl } from '../../config/constants';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

// Custom hook for CORS-safe image loading
const useImageLoader = (imagePath: string | null) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const fullUrl = getImageUrl(imagePath);
        if (!fullUrl) {
          throw new Error('Invalid image path');
        }

        // Fetch image as blob to bypass CORS restrictions
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Origin': window.location.origin,
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err: any) {
        console.error('❌ Failed to load image via CORS-safe method:', err);
        setError(err.message || 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function to revoke object URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imagePath]);

  return { imageUrl, loading, error };
};

// Component for displaying individual calendar images with CORS-safe loading
const CalendarImageDisplay: React.FC<{
  image: CalendarAttachment;
  isMarkedForDeletion: boolean;
  onToggleDeletion: (attachmentId: number) => void;
  onSetPrimary?: (attachmentId: number) => void;
}> = ({ image, isMarkedForDeletion, onToggleDeletion, onSetPrimary }) => {
  const { imageUrl, loading, error } = useImageLoader(image.file_path);

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '1',
        borderRadius: '8px',
        overflow: 'hidden',
        border: image.is_primary ? '2px solid #22c55e' : '1px solid #e5e7eb',
        opacity: isMarkedForDeletion ? 0.5 : 1,
        filter: isMarkedForDeletion ? 'grayscale(100%)' : 'none',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Loading state */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          color: '#6b7280',
          fontSize: '0.75rem',
          textAlign: 'center',
          padding: '8px'
        }}>
          <ImageIcon size={24} />
          <div style={{ marginTop: '4px' }}>Loading...</div>
        </div>
      )}

      {/* Loading/Error state */}
      {(error || loading) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          color: '#64748b',
          fontSize: '0.75rem',
          textAlign: 'center',
          padding: '8px'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⏳</div>
          <div style={{ wordBreak: 'break-all' }}>
            Image loading...<br/>{image.file_name}
          </div>
        </div>
      )}

      {/* Image */}
      {imageUrl && !loading && !error && (
        <img
          src={imageUrl}
          alt={image.file_name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        display: 'flex',
        gap: '4px'
      }}>
        {/* Set Primary Button */}
        {!image.is_primary && !isMarkedForDeletion && onSetPrimary && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSetPrimary(image.attachment_id);
            }}
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.7)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Set as primary"
          >
            <Star size={12} />
          </button>
        )}

        {/* Delete/Undelete Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleDeletion(image.attachment_id);
          }}
          style={{
            backgroundColor: isMarkedForDeletion ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={isMarkedForDeletion ? 'Undo delete' : 'Mark for deletion'}
        >
          <X size={12} />
        </button>
      </div>



      {/* Deletion Overlay */}
      {isMarkedForDeletion && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Will be deleted
        </div>
      )}
    </div>
  );
};

interface CalendarImageUploadProps {
  onImagesChange: (files: File[]) => void;
  existingImages?: CalendarAttachment[];
  onSetPrimary?: (attachmentId: number) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  // Pending deletion props
  pendingDeletes?: number[];
  onMarkForDeletion?: (attachmentId: number) => void;
  onUnmarkForDeletion?: (attachmentId: number) => void;
}

const CalendarImageUpload: React.FC<CalendarImageUploadProps> = ({
  onImagesChange,
  existingImages = [],
  onSetPrimary,
  maxImages = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = '',
  disabled = false,
  pendingDeletes = [],
  onMarkForDeletion,
  onUnmarkForDeletion
}) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`;
    }
    return null;
  }, [acceptedTypes, maxFileSize]);

  // Process files
  const processFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    const totalImages = images.length + existingImages.length;
    
    if (totalImages + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can add ${maxImages - totalImages} more.`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    setError(null);

    const newImages: ImageFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => {
      const updated = [...prev, ...newImages];
      onImagesChange(updated.map(img => img.file));
      return updated;
    });
  }, [images.length, existingImages.length, maxImages, validateFile, onImagesChange]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Remove new image
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Clean up object URL
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      onImagesChange(updated.map(img => img.file));
      return updated;
    });
  }, [onImagesChange]);

  // Toggle existing image for deletion
  const toggleExistingImageDeletion = useCallback((attachmentId: number) => {
    const isMarkedForDeletion = pendingDeletes.includes(attachmentId);

    if (isMarkedForDeletion) {
      console.log('🔄 Unmarking image for deletion:', attachmentId);
      onUnmarkForDeletion?.(attachmentId);
    } else {
      console.log('🏷️ Marking image for deletion:', attachmentId);
      onMarkForDeletion?.(attachmentId);
    }
  }, [pendingDeletes, onMarkForDeletion, onUnmarkForDeletion]);

  // Set primary image
  const setPrimaryImage = useCallback((attachmentId: number) => {
    if (onSetPrimary) {
      onSetPrimary(attachmentId);
    }
  }, [onSetPrimary]);

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const totalImages = images.length + existingImages.length;
  const canAddMore = totalImages < maxImages && !disabled;

  return (
    <div className={`calendar-image-upload ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: dragActive ? '#f3f4f6' : disabled ? '#f9fafb' : 'white',
            borderColor: dragActive ? '#22c55e' : error ? '#ef4444' : '#d1d5db',
            marginBottom: '1rem'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          <Upload 
            size={48} 
            style={{ 
              color: dragActive ? '#22c55e' : disabled ? '#9ca3af' : '#6b7280',
              marginBottom: '1rem'
            }} 
          />
          
          <p style={{ 
            color: disabled ? '#9ca3af' : '#374151',
            fontSize: '1rem',
            fontWeight: '500',
            marginBottom: '0.5rem'
          }}>
            {dragActive ? 'Drop images here' : 'Click to upload or drag and drop'}
          </p>
          
          <p style={{ 
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            PNG, JPG, GIF, WebP up to {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
            <br />
            {totalImages}/{maxImages} images
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '0.75rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} style={{ color: '#ef4444', marginTop: '0.125rem', flexShrink: 0 }} />
          <div style={{ color: '#dc2626', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
            {error}
          </div>
        </div>
      )}

      {/* Image Grid */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '1rem'
        }}>
          {/* Existing Images */}
          {existingImages.map((image) => {
            const isMarkedForDeletion = pendingDeletes.includes(image.attachment_id);

            return (
              <CalendarImageDisplay
                key={`existing-${image.attachment_id}`}
                image={image}
                isMarkedForDeletion={isMarkedForDeletion}
                onToggleDeletion={toggleExistingImageDeletion}
                onSetPrimary={onSetPrimary}
              />
            );
          })}

          {/* New Images */}
          {images.map((image) => (
            <div
              key={image.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb'
              }}
            >
              <img
                src={image.preview}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              <button
                onClick={() => removeImage(image.id)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: 'rgba(239, 68, 68, 0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {existingImages.length === 0 && images.length === 0 && !canAddMore && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No images uploaded</p>
        </div>
      )}
    </div>
  );
};

export default CalendarImageUpload;
