import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Camera, AlertCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';

interface ProfilePictureUploadProps {
  currentPicture?: string;
  userInitials?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
  size?: number; // Size in pixels for the circular avatar
  showActions?: boolean; // Whether to show action buttons
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  userInitials = 'U',
  onUpload,
  onRemove,
  isLoading = false,
  className = '',
  size = 120,
  showActions = true
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 2MB';
    }

    return null;
  }, []);

  // Handle file selection (now just sets preview and pending file)
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setSuccess(null);
    setShowDropdown(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setPendingFile(file);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  // Handle save (upload the pending file)
  const handleSave = useCallback(async () => {
    if (!pendingFile) return;

    try {
      await onUpload(pendingFile);
      setSuccess('Profile picture updated successfully!');
      setPendingFile(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture');
      setPreview(null);
      setPendingFile(null);
    }
  }, [pendingFile, onUpload]);

  // Handle cancel (discard preview and pending file)
  const handleCancel = useCallback(() => {
    setPreview(null);
    setPendingFile(null);
    setError(null);
  }, []);

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle camera icon click
  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Handle change photo
  const handleChangePhoto = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  // Handle remove photo
  const handleRemovePhoto = async () => {
    setShowDropdown(false);

    const confirmed = window.confirm('Are you sure you want to remove your profile picture? You can always upload a new one later.');

    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setPreview(null);
    setPendingFile(null);

    try {
      await onRemove();
      setSuccess('Profile picture removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove profile picture');
    }
  };

  // Get display image
  const displayImage = preview || currentPicture;
  const hasImage = Boolean(displayImage);
  const hasPendingChanges = Boolean(pendingFile);

  // Debug logging
  console.log('🔍 ProfilePictureUpload - Props:', {
    currentPicture,
    preview,
    displayImage,
    hasImage,
    hasPendingChanges
  });

  return (
    <div className={`profile-picture-upload ${className}`}>
      {/* Facebook-style Circular Avatar with Camera Overlay */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          ref={avatarRef}
          style={{
            position: 'relative',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            border: isDragOver ? '4px solid #22c55e' : hasPendingChanges ? '4px solid #facc15' : '4px solid #e8f5e8',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: isHovered ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
            transform: isHovered ? 'scale(1.02)' : 'scale(1)'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {hasImage ? (
            <img
              src={displayImage}
              alt="Profile"
              onLoad={() => console.log('✅ Image loaded successfully:', displayImage)}
              onError={(e) => console.error('❌ Image failed to load:', displayImage, e)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'filter 0.3s ease',
                filter: isHovered ? 'brightness(0.9)' : 'brightness(1)'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: `${size * 0.3}px`,
                transition: 'filter 0.3s ease',
                filter: isHovered ? 'brightness(0.9)' : 'brightness(1)'
              }}
            >
              {userInitials}
            </div>
          )}

          {/* Drag Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(34, 197, 94, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDragOver ? 1 : 0,
              transition: 'opacity 0.3s ease',
              borderRadius: '50%'
            }}
          >
            <Upload size={size * 0.2} color="white" />
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
            >
              <div
                style={{
                  width: `${size * 0.2}px`,
                  height: `${size * 0.2}px`,
                  border: '3px solid #e8f5e8',
                  borderTop: '3px solid #22c55e',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            </div>
          )}
        </div>

        {/* Facebook-style Camera Icon Overlay (Bottom-right) */}
        <div
          onClick={handleCameraClick}
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            width: `${size * 0.25}px`,
            height: `${size * 0.25}px`,
            background: '#ffffff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: '2px solid #ffffff',
            transition: 'all 0.2s ease',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          <Camera size={size * 0.12} color="#374151" />
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${size + 10}px`,
              right: '0',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e8f5e8',
              minWidth: '180px',
              zIndex: 1000,
              overflow: 'hidden',
              animation: 'dropdownFadeIn 0.2s ease-out'
            }}
          >
            <button
              onClick={handleChangePhoto}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                transition: 'background-color 0.2s ease',
                opacity: isLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Edit3 size={16} />
              Change Photo
            </button>

            {hasImage && (
              <button
                onClick={handleRemovePhoto}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#dc2626',
                  transition: 'background-color 0.2s ease',
                  opacity: isLoading ? 0.6 : 1,
                  borderTop: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Trash2 size={16} />
                Remove Photo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Save/Cancel Buttons (only show when there are pending changes) */}
      {hasPendingChanges && showActions && (
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.2)';
            }}
          >
            <CheckCircle size={16} />
            Save Changes
          </button>

          <button
            onClick={handleCancel}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: '2px solid #e8f5e8',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              opacity: isLoading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e8f5e8';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={16} />
            Cancel
          </button>
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />



      {/* Messages */}
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <AlertCircle size={20} style={{ marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Error</div>
            <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <CheckCircle size={20} style={{ marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Success</div>
            <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{success}</div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dropdownFadeIn {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePictureUpload;
