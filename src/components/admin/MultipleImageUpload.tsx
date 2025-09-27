import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { validateFile, formatFileSize } from '../../utils/formUtils';
import { getImageUrl } from '../../config/constants';

// Reusable delete button component
interface DeleteButtonProps {
  onClick: () => void;
  isMarkedForDeletion?: boolean;
  title?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  isMarkedForDeletion = false,
  title
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '0.25rem',
      backgroundColor: isMarkedForDeletion
        ? 'rgba(34, 197, 94, 0.9)' // Green for undo
        : 'rgba(239, 68, 68, 0.9)', // Red for delete
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    title={title || (isMarkedForDeletion ? "Undo deletion" : "Delete")}
  >
    {isMarkedForDeletion ? <RotateCcw size={14} /> : <X size={14} />}
  </button>
);

// Custom hook for CORS-safe image loading
const useImageLoader = (imagePath: string | null) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      setLoading(false);
      setError(null);
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

        console.log('🔄 Loading image via CORS-safe method:', fullUrl);

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

        console.log('✅ Image loaded successfully via CORS-safe method');
        setImageUrl(objectUrl);

      } catch (err) {
        console.error('❌ Image fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup object URL on unmount
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imagePath]);

  return { imageUrl, loading, error };
};

// CORS-safe image component
interface SafeImageProps {
  imagePath: string | null;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ imagePath, alt, style, className }) => {
  const { imageUrl, loading, error } = useImageLoader(imagePath);

  if (loading) {
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b'
      }} className={className}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>⏳</div>
          <div style={{ fontSize: '0.875rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b'
      }} className={className}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>⏳</div>
          <div style={{ fontSize: '0.875rem' }}>Image loading...</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      style={style}
      className={className}
      onLoad={() => {
        console.log('✅ Image rendered successfully via CORS-safe method');
      }}
    />
  );
};

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'success' | 'error' | 'pending';
  progress: number;
  error?: string;
}

interface ExistingImage {
  attachment_id: number;
  file_name: string;
  file_path: string;
  file_url: string;
  display_order: number;
  is_primary: boolean;
}

interface MultipleImageUploadProps {
  onImagesChange: (files: File[]) => void;
  existingImages?: ExistingImage[];
  onExistingImageDelete?: (attachmentId: number) => void;

  onSetPrimary?: (attachmentId: number) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  // New props for pending deletion
  pendingDeletes?: number[];
  onMarkForDeletion?: (attachmentId: number) => void;
  onUnmarkForDeletion?: (attachmentId: number) => void;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  onImagesChange,
  existingImages = [],
  onExistingImageDelete,
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

  // Debug existing images
  useEffect(() => {
    console.log('🖼️ MultipleImageUpload - Existing images received:', {
      count: existingImages.length,
      images: existingImages.map(img => ({ id: img.attachment_id, name: img.file_name }))
    });
  }, [existingImages]);

  // Calculate total images (existing + new)
  const totalImages = existingImages.length + images.length;
  const canAddMore = totalImages < maxImages && !disabled;

  // Validate file using utility function
  const validateFileLocal = useCallback((file: File): string | null => {
    return validateFile(file, {
      maxSize: maxFileSize,
      allowedTypes: acceptedTypes
    });
  }, [acceptedTypes, maxFileSize]);

  // Process files
  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const newImages: ImageFile[] = [];
    let hasErrors = false;

    // Check if adding these files would exceed the limit
    if (totalImages + files.length > maxImages) {
      setError(`Cannot add ${files.length} images. Maximum ${maxImages} images allowed (${totalImages} already selected).`);
      return;
    }

    files.forEach((file, index) => {
      const validationError = validateFileLocal(file);
      
      if (validationError) {
        hasErrors = true;
        setError(validationError);
        return;
      }

      const imageFile: ImageFile = {
        id: `${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0
      };

      newImages.push(imageFile);
    });

    if (!hasErrors && newImages.length > 0) {
      setError(null);
      setImages(prev => [...prev, ...newImages]);
      
      // Notify parent component
      const allFiles = [...images.map(img => img.file), ...newImages.map(img => img.file)];
      onImagesChange(allFiles);
    }
  }, [images, totalImages, maxImages, validateFileLocal, onImagesChange]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
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

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Clean up object URL
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.preview);
      }
      
      // Notify parent component
      onImagesChange(updated.map(img => img.file));
      return updated;
    });
  }, [onImagesChange]);

  // Toggle existing image for deletion
  const toggleExistingImageDeletion = useCallback((attachmentId: number) => {
    const isMarkedForDeletion = pendingDeletes.includes(attachmentId);

    if (isMarkedForDeletion) {
      onUnmarkForDeletion?.(attachmentId);
    } else {
      onMarkForDeletion?.(attachmentId);
    }
  }, [pendingDeletes, onMarkForDeletion, onUnmarkForDeletion]);

  // Remove existing image (fallback to pending system)
  const removeExistingImage = useCallback((attachmentId: number) => {
    toggleExistingImageDeletion(attachmentId);
  }, [toggleExistingImageDeletion]);

  // Set primary image
  const setPrimaryImage = useCallback((attachmentId: number) => {
    if (onSetPrimary) {
      onSetPrimary(attachmentId);
    }
  }, [onSetPrimary]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={`multiple-image-upload ${className}`}>
      {/* Error Display */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '0.875rem',
          marginBottom: '1rem'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          style={{
            position: 'relative',
            border: `2px dashed ${dragActive ? '#22c55e' : '#d1d5db'}`,
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f0fdf4' : '#fafafa',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1.5rem'
          }}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={disabled}
          />
          
          <Upload 
            size={48} 
            style={{ 
              color: dragActive ? '#22c55e' : '#9ca3af',
              marginBottom: '1rem'
            }} 
          />
          
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            {dragActive ? 'Drop images here' : 'Upload Images'}
          </h3>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '0.5rem'
          }}>
            Drag and drop images here, or click to select files
          </p>
          
          <p style={{
            fontSize: '0.75rem',
            color: '#9ca3af'
          }}>
            Maximum {maxImages} images • {formatFileSize(maxFileSize)} per file
            <br />
            {totalImages}/{maxImages} images selected
          </p>
        </div>
      )}

      {/* Image Grid */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {/* Existing Images */}
          {existingImages.map((image) => {
            const isMarkedForDeletion = pendingDeletes.includes(image.attachment_id);

            return (
              <div
                key={`existing-${image.attachment_id}`}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: image.is_primary ? '3px solid #22c55e' : '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  opacity: isMarkedForDeletion ? 0.5 : 1,
                  filter: isMarkedForDeletion ? 'grayscale(100%)' : 'none',
                  transition: 'opacity 0.2s ease, filter 0.2s ease'
                }}
              >
                {/* Deletion overlay */}
                {isMarkedForDeletion && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      Will be deleted
                    </div>
                  </div>
                )}
              <SafeImage
                imagePath={image.file_path}
                alt={image.file_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              

              
              {/* Action Buttons */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                gap: '0.25rem'
              }}>
                {!image.is_primary && onSetPrimary && (
                  <button
                    onClick={() => setPrimaryImage(image.attachment_id)}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Set as primary"
                  >
                    <CheckCircle size={14} />
                  </button>
                )}
                
                {/* Delete/Undelete Button */}
                {(() => {
                  const hasPendingProps = onMarkForDeletion && onUnmarkForDeletion;
                  const hasImmediateProps = onExistingImageDelete;

                  console.log('🔍 Button render for image', image.attachment_id, {
                    hasPendingProps,
                    hasImmediateProps,
                    isMarkedForDeletion
                  });

                  if (hasPendingProps) {
                    return (
                      <DeleteButton
                        onClick={() => toggleExistingImageDeletion(image.attachment_id)}
                        isMarkedForDeletion={isMarkedForDeletion}
                        title={isMarkedForDeletion ? "Undo deletion" : "Mark for deletion"}
                      />
                    );
                  } else if (hasImmediateProps) {
                    return (
                      <DeleteButton
                        onClick={() => removeExistingImage(image.attachment_id)}
                        title="Remove image"
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
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
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}
            >
              <img
                src={image.preview}
                alt={image.file.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: image.status === 'uploading' ? 0.7 : 1
                }}
              />
              
              {/* Status Overlay */}
              {image.status === 'uploading' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem'
                }}>
                  Uploading...
                </div>
              )}
              
              {/* Remove Button */}
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem'
              }}>
                <DeleteButton
                  onClick={() => removeImage(image.id)}
                  title="Remove image"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultipleImageUpload;
