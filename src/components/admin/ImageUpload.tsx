import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  currentImageUrl?: string;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImageUrl,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedFormats, maxSize]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setIsLoading(true);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setIsLoading(false);
      onImageSelect(file);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [validateFile, onImageSelect]);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setError('Please drop an image file');
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className} style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Image Upload (Optional)
        </label>
        <p style={{
          fontSize: '12px',
          color: '#6B7280',
          margin: 0
        }}>
          Supported formats: JPEG, PNG, GIF, WebP. Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
        </p>
      </div>

      {preview ? (
        // Image preview
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #E5E7EB'
          }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                const button = e.currentTarget.querySelector('button') as HTMLElement;
                if (button) button.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                const button = e.currentTarget.querySelector('button') as HTMLElement;
                if (button) button.style.opacity = '0';
              }}
            >
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: '0',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Remove image"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#EF4444';
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={openFileDialog}
            style={{
              marginTop: '8px',
              fontSize: '14px',
              color: '#2563EB',
              textDecoration: 'underline',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1D4ED8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#2563EB';
            }}
          >
            Change image
          </button>
        </div>
      ) : (
        // Upload area
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            border: `2px dashed ${isDragging ? '#60A5FA' : '#D1D5DB'}`,
            borderRadius: '8px',
            backgroundColor: isDragging ? '#EFF6FF' : '#F9FAFB',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isLoading ? openFileDialog : undefined}
          onMouseEnter={(e) => {
            if (!isLoading && !isDragging) {
              e.currentTarget.style.borderColor = '#9CA3AF';
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && !isDragging) {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid #E5E7EB',
                  borderTop: '2px solid #2563EB',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '8px'
                }}></div>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  margin: 0
                }}>
                  Processing image...
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '50%',
                  marginBottom: '12px'
                }}>
                  {isDragging ? (
                    <Upload style={{ width: '24px', height: '24px', color: '#2563EB' }} />
                  ) : (
                    <ImageIcon style={{ width: '24px', height: '24px', color: '#9CA3AF' }} />
                  )}
                </div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px',
                  textAlign: 'center',
                  margin: '0 0 4px 0'
                }}>
                  {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  textAlign: 'center',
                  margin: 0
                }}>
                  JPEG, PNG, GIF, WebP up to {(maxSize / (1024 * 1024)).toFixed(1)}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          color: '#DC2626'
        }}>
          <AlertCircle size={16} style={{ marginRight: '4px' }} />
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImageUpload;
