import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Eye, MessageCircle, Heart, Pin, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Announcement } from '../../../services/announcementService';
import { getImageUrl } from '../../../config/constants';

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

        console.log('🔄 Fetching image via CORS-safe method:', fullUrl);

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

        console.log('✅ Image loaded successfully via fetch');

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

// Facebook-style image gallery component
interface FacebookImageGalleryProps {
  images: string[];
  altPrefix: string;
  maxVisible?: number;
  onImageClick?: (index: number) => void;
}

const FacebookImageGallery: React.FC<FacebookImageGalleryProps> = ({
  images,
  altPrefix,
  maxVisible = 4,
  onImageClick
}) => {
  // Call hooks at the top level for maximum possible images (Rules of Hooks compliance)
  const imageLoader0 = useImageLoader(images?.[0] || null);
  const imageLoader1 = useImageLoader(images?.[1] || null);
  const imageLoader2 = useImageLoader(images?.[2] || null);
  const imageLoader3 = useImageLoader(images?.[3] || null);

  // Create array of results for easy access
  const imageLoaderResults = [imageLoader0, imageLoader1, imageLoader2, imageLoader3];

  if (!images || images.length === 0) return null;

  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  const getImageStyle = (index: number, total: number): React.CSSProperties => {
    if (total === 1) {
      // For single images, use more flexible sizing to show full image
      return {
        maxWidth: '100%',
        maxHeight: '500px',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, filter 0.2s ease',
        borderRadius: '12px'
      };
    }

    // For multiple images, use 'contain' to show full images without cropping
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, filter 0.2s ease',
      borderRadius: '8px'
    };

    return baseStyle;
  };

  const getContainerStyle = (index: number, total: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    if (total === 1) {
      return {
        ...baseStyle,
        width: '100%',
        maxHeight: '500px', // Use maxHeight instead of fixed height for better flexibility
        minHeight: '200px', // Ensure minimum height for very small images
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      };
    }

    if (total === 2) {
      return {
        ...baseStyle,
        width: '50%',
        minHeight: '200px',
        maxHeight: '350px',
        borderRadius: '8px'
      };
    }

    if (total === 3) {
      if (index === 0) {
        return {
          ...baseStyle,
          width: '60%',
          minHeight: '200px',
          maxHeight: '350px',
          borderRadius: '8px'
        };
      } else {
        return {
          ...baseStyle,
          width: '100%',
          minHeight: '120px',
          maxHeight: '175px',
          borderRadius: '8px'
        };
      }
    }

    // 4+ images
    if (index === 0) {
      return {
        ...baseStyle,
        width: '60%',
        minHeight: '200px',
        maxHeight: '350px',
        borderRadius: '8px'
      };
    } else {
      return {
        ...baseStyle,
        width: '100%',
        minHeight: '80px',
        maxHeight: '120px',
        borderRadius: '8px'
      };
    }
  };

  const renderOverlay = (index: number, count: number) => {
    if (index === maxVisible - 1 && count > 0) {
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '600',
          borderRadius: '8px'
        }}>
          +{count}
        </div>
      );
    }
    return null;
  };

  // Get the first image loader result
  const firstImageResult = imageLoaderResults[0];
  const { imageUrl: firstImageUrl, loading: firstImageLoading, error: firstImageError } = firstImageResult;

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      width: '100%',
      marginBottom: '1.5rem'
    }}>
      {/* Main image or left side */}
      <div style={getContainerStyle(0, visibleImages.length)}>
        {firstImageLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>⏳</div>
              <div>Loading image...</div>
            </div>
          </div>
        )}

        {firstImageError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: '#f3f4f6',
            color: '#6b7280',
            borderRadius: '12px',
            fontSize: '0.875rem',
            border: '2px dashed #d1d5db'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🖼️</div>
              <div style={{ fontWeight: '500' }}>Image unavailable</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#9ca3af' }}>
                {firstImageError}
              </div>
            </div>
          </div>
        )}

        {firstImageUrl && !firstImageLoading && !firstImageError && (
          <img
            src={firstImageUrl}
            alt={`${altPrefix} - Image 1`}
            style={getImageStyle(0, visibleImages.length)}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1';
              console.log('✅ Image rendered successfully via CORS-safe method');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        )}
        {onImageClick && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer'
            }}
            onClick={() => onImageClick(0)}
          />
        )}
      </div>

      {/* Right side images (for 2+ images) */}
      {visibleImages.length > 1 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: visibleImages.length === 2 ? '50%' : '40%'
        }}>
          {visibleImages.slice(1).map((_, idx) => {
            const actualIndex = idx + 1;
            // Use the pre-loaded image loader result instead of calling the hook
            const { imageUrl, loading, error } = imageLoaderResults[actualIndex];

            return (
              <div
                key={actualIndex}
                style={getContainerStyle(actualIndex, visibleImages.length)}
              >
                {loading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#6b7280'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>⏳</div>
                      <div style={{ fontSize: '0.75rem' }}>Loading...</div>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    border: '2px dashed #d1d5db'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>🖼️</div>
                      <div>Error</div>
                    </div>
                  </div>
                )}

                {imageUrl && !loading && !error && (
                  <img
                    src={imageUrl}
                    alt={`${altPrefix} - Image ${actualIndex + 1}`}
                    style={getImageStyle(actualIndex, visibleImages.length)}
                    onLoad={(e) => {
                      e.currentTarget.style.opacity = '1';
                      console.log('✅ Image rendered successfully via CORS-safe method');
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                )}
                {renderOverlay(actualIndex, remainingCount)}
                {onImageClick && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      cursor: 'pointer'
                    }}
                    onClick={() => onImageClick(actualIndex)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Full-Size Image Component
interface FullSizeImageProps {
  imagePath: string;
}

const FullSizeImage: React.FC<FullSizeImageProps> = ({ imagePath }) => {
  const { imageUrl, loading, error } = useImageLoader(imagePath);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '300px',
        minHeight: '300px',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>⏳</div>
          <div style={{ fontSize: '1.2rem' }}>Loading image...</div>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '300px',
        minHeight: '300px',
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        border: '2px dashed rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>🖼️</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>Image unavailable</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
            {error || 'Failed to load image'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Full size view"
      style={{
        // Responsive sizing that adapts to screen size
        maxWidth: windowSize.width > 768 ? 'calc(100vw - 240px)' : 'calc(100vw - 120px)',
        maxHeight: windowSize.height > 600 ? 'calc(100vh - 240px)' : 'calc(100vh - 160px)',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'block' // Ensure proper rendering
      }}
      onLoad={(e) => {
        e.currentTarget.style.opacity = '1';
        console.log('✅ Full-size image loaded successfully');
      }}
    />
  );
};

interface AnnouncementViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const AnnouncementViewDialog: React.FC<AnnouncementViewDialogProps> = ({
  isOpen,
  onClose,
  announcement
}) => {
  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Image viewer functions
  const openImageViewer = (index: number, images: string[]) => {
    setAllImages(images);
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentImageIndex(0);
    setAllImages([]);
  };

  const goToNextImage = () => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const goToPreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Keyboard navigation for image viewer
  useEffect(() => {
    if (!imageViewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          closeImageViewer();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageViewerOpen, currentImageIndex, allImages.length]);

  // Handle window resize for responsive image viewer
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isOpen || !announcement) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#10b981';
      case 'draft': return '#6b7280';
      case 'scheduled': return '#f59e0b';
      case 'archived': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get all images for the announcement
  const getAllAnnouncementImages = () => {
    return (announcement.attachments && announcement.attachments.length > 0)
      ? announcement.attachments.map(att => att.file_path)
      : (announcement.images && announcement.images.length > 0)
        ? announcement.images.map(img => img.file_path)
        : [announcement.image_url || announcement.image_path].filter(Boolean) as string[];
  };

  return (
    <div
      style={{
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div style={{ flex: 1, marginRight: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                  marginRight: '1rem'
                }}
              >
                {announcement.title}
              </h2>
              
              {/* Status Badge */}
              <span
                style={{
                  backgroundColor: getStatusColor(announcement.status),
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}
              >
                {getStatusText(announcement.status)}
              </span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Boolean(announcement.is_pinned) && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <Pin size={12} />
                  Pinned
                </span>
              )}
              
              {Boolean(announcement.is_alert) && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <AlertTriangle size={12} />
                  Alert
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '1.5rem',
            maxHeight: 'calc(90vh - 200px)',
            overflowY: 'auto'
          }}
        >
          {/* Image - Facebook-style Gallery */}
          {((announcement.attachments && announcement.attachments.length > 0) ||
            (announcement.images && announcement.images.length > 0) ||
            announcement.image_url || announcement.image_path) && (
            <FacebookImageGallery
              images={
                // Use attachments/images array if available, otherwise fallback to single image
                (announcement.attachments && announcement.attachments.length > 0)
                  ? announcement.attachments.map(att => att.file_path)
                  : (announcement.images && announcement.images.length > 0)
                    ? announcement.images.map(img => img.file_path)
                    : [announcement.image_url || announcement.image_path].filter(Boolean) as string[]
              }
              altPrefix={announcement.title}
              maxVisible={4}
              onImageClick={(index) => {
                const images = getAllAnnouncementImages();
                openImageViewer(index, images);
              }}
            />
          )}

          {/* Content */}
          <div
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#374151',
              marginBottom: '2rem',
              whiteSpace: 'pre-wrap'
            }}
          >
            {announcement.content}
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}
          >
            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Author</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {announcement.author_name || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Category</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {announcement.category_name || 'Uncategorized'}
                </p>
              </div>
            </div>

            {/* Created Date */}
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Created</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {formatDate(announcement.created_at)}
                </p>
              </div>
            </div> */}

            {/* Published Date */}
            {/* {announcement.published_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: '#6b7280' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Published</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                    {formatDate(announcement.published_at)}
                  </p>
                </div>
              </div>
            )} */}

            {/* Scheduled Date */}
            {/* {announcement.scheduled_publish_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: '#6b7280' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Scheduled</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                    {formatDate(announcement.scheduled_publish_at)}
                  </p>
                </div>
              </div>
            )} */}

            {/* Visibility Start Date */}
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Visible From</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {formatDate(announcement.visibility_start_at)}
                </p>
              </div>
            </div> */}

            {/* Visibility End Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Visible Until</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {formatDate(announcement.visibility_end_at)}
                </p>
              </div>
            </div>

            {/* View Count */}
            {/* I will comment 'View Count' for the mean time and I will uncomment this in the future */}
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Views</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {(announcement.view_count || 0).toLocaleString()}
                </p>
              </div>
            </div> */}

            {/* Reaction Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Reactions</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {(announcement.reaction_count || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Comment Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={16} style={{ color: '#6b7280' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Comments</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                  {(announcement.comment_count || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          {/* I will comment 'Settings' for the mean time and I will uncomment this in the future */}
          {/* <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px'
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: '0 0 0.75rem 0' }}>
              Settings
            </h4>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: Boolean(announcement.allow_comments) ? '#10b981' : '#ef4444'
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Comments {Boolean(announcement.allow_comments) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: Boolean(announcement.allow_sharing) ? '#10b981' : '#ef4444'
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Sharing {Boolean(announcement.allow_sharing) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Full-Size Image Viewer */}
      {imageViewerOpen && allImages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100, // Higher than the main dialog
            padding: '2rem'
          }}
          onClick={closeImageViewer}
        >
          <div
            style={{
              position: 'relative',
              // Responsive container sizing
              maxWidth: windowSize.width > 768 ? 'calc(100vw - 200px)' : 'calc(100vw - 100px)',
              maxHeight: windowSize.height > 600 ? 'calc(100vh - 200px)' : 'calc(100vh - 140px)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeImageViewer}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 1102,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
            >
              <X size={20} color="#333" />
            </button>

            {/* Previous Button */}
            {allImages.length > 1 && currentImageIndex > 0 && (
              <button
                onClick={goToPreviousImage}
                style={{
                  position: 'absolute',
                  left: windowSize.width > 768 ? '-60px' : '-45px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: windowSize.width > 768 ? '50px' : '40px',
                  height: windowSize.width > 768 ? '50px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1102,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                <ChevronLeft size={windowSize.width > 768 ? 24 : 20} color="#333" />
              </button>
            )}

            {/* Next Button */}
            {allImages.length > 1 && currentImageIndex < allImages.length - 1 && (
              <button
                onClick={goToNextImage}
                style={{
                  position: 'absolute',
                  right: windowSize.width > 768 ? '-60px' : '-45px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: windowSize.width > 768 ? '50px' : '40px',
                  height: windowSize.width > 768 ? '50px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 1102,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                <ChevronRight size={windowSize.width > 768 ? 24 : 20} color="#333" />
              </button>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-50px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}
              >
                {currentImageIndex + 1} of {allImages.length}
              </div>
            )}

            {/* Full-Size Image */}
            <FullSizeImage imagePath={allImages[currentImageIndex]} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementViewDialog;
