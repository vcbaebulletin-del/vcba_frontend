import React, { useState, useEffect, useRef } from 'react';
import { getImageUrl, ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY } from '../../config/constants';



// Custom hook for CORS-safe image loading with role-aware authentication
const useImageLoader = (imagePath: string | null, userRole?: 'admin' | 'student') => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup previous blob URL if it exists
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }

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

        // Get the appropriate token based on user role
        const authToken = userRole === 'admin'
          ? localStorage.getItem(ADMIN_AUTH_TOKEN_KEY)
          : localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Origin': window.location.origin,
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        // Store the blob URL for cleanup
        currentBlobUrl.current = objectUrl;
        setImageUrl(objectUrl);

        console.log('✅ Image loaded successfully via CORS-safe method');

      } catch (err) {
        console.error('❌ Image fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }
    };
  }, [imagePath, userRole]);

  return { imageUrl, loading, error };
};

// Reusable CORS-safe image component
interface ImageDisplayProps {
  imagePath: string | null;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  userRole?: 'admin' | 'student';
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLImageElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLImageElement>) => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imagePath,
  alt,
  style,
  className,
  userRole,
  onLoad,
  onMouseEnter,
  onMouseLeave
}) => {
  const { imageUrl, loading, error } = useImageLoader(imagePath, userRole);

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
        color: '#64748b',
        border: '2px dashed #cbd5e1'
      }} className={className}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>🖼️</div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Image unavailable</div>
          {error && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#9ca3af' }}>
              {error}
            </div>
          )}
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
      onLoad={(e) => {
        console.log('✅ Image rendered successfully via CORS-safe method');
        onLoad?.(e);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};

// Facebook-style image gallery component with responsive grid design
interface FacebookImageGalleryProps {
  images: string[];
  altPrefix: string;
  maxVisible?: number;
  userRole?: 'admin' | 'student';
  onImageClick?: (index: number) => void;
}

const FacebookImageGallery: React.FC<FacebookImageGalleryProps> = ({
  images,
  altPrefix,
  maxVisible = 5,
  userRole,
  onImageClick
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!images || images.length === 0) return null;

  // Prepare images for display - limit to create proper Facebook-style layouts
  const maxDisplayCount = isMobile ? Math.min(4, maxVisible) : Math.min(maxVisible, 9); // Allow up to 9 images for 3x3 grid
  const displayImages = images.slice(0, maxDisplayCount);
  const remainingCount = Math.max(0, images.length - maxDisplayCount);

  // Handle image click
  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  // Facebook-style responsive grid layout - COMPACT & BOXY
  const getGridStyle = (imageCount: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'grid',
      gap: '0.125rem', // 2px gap like Facebook
      width: '100%',
      marginBottom: '1rem',
      borderRadius: '0.5rem',
      overflow: 'hidden'
    };

    // Mobile: Compact 2x2 grid layout (like your reference image)
    if (isMobile) {
      if (imageCount === 1) {
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr',
          height: '12rem' // 192px - square-ish
        };
      } else if (imageCount === 2) {
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr',
          height: '9rem' // 144px - compact rectangles
        };
      } else {
        // 3+ images: Always use 2x2 grid on mobile (like your reference)
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: '12rem' // 192px - compact 2x2 grid
        };
      }
    }

    // Desktop layouts - Enhanced for better Facebook-like appearance
    switch (imageCount) {
      case 1:
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr',
          // Remove fixed height for single images to allow natural sizing
          width: '100%',
          position: 'relative' as const
        };
      case 2:
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr',
          height: '24rem' // 384px - Much taller for better proportions
        };
      case 3:
        return {
          ...baseStyle,
          gridTemplateColumns: '2fr 1fr', // Left larger, right smaller
          gridTemplateRows: '1fr 1fr',
          height: '24rem' // 384px - Much taller for proper 2-row layout
        };
      case 4:
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: '24rem' // 384px - 2x2 grid
        };
      case 5:
        return {
          ...baseStyle,
          gridTemplateColumns: '2fr 1fr 1fr', // Facebook 5-image style: 1 large left + 4 small right
          gridTemplateRows: '1fr 1fr',
          height: '24rem' // 384px - Facebook-style layout
        };
      case 6:
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          height: '24rem' // 384px - 3x2 grid
        };
      case 7:
      case 8:
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          height: '30rem' // 480px - 3x3 grid (taller for 3 rows)
        };
      default: // 9+ images
        return {
          ...baseStyle,
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '1fr 1fr 1fr',
          height: '30rem' // 480px - 3x3 grid with +N overlay
        };
    }
  };

  const getImageContainerStyle = (index: number, total: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#f8fafc',
      cursor: onImageClick ? 'pointer' : 'default',
      borderRadius: '0.25rem' // 4px border radius for individual images (tighter)
    };

    // Special styling for single image on desktop (with blurred background)
    if (total === 1 && !isMobile) {
      return {
        ...baseStyle,
        backgroundColor: '#000', // Dark background for blurred effect
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.5rem',
        width: '100%',
        height: '28rem', // Fixed height for blurred background container
        position: 'relative' as const
      };
    }

    // Mobile: Compact grid positioning (2x2 layout for 3+ images)
    if (isMobile) {
      if (total === 3 && index === 0) {
        return {
          ...baseStyle,
          gridColumn: '1 / 3', // First image spans both columns (top row)
        };
      }
      return baseStyle; // Other images fit in grid normally
    }

    // Desktop Facebook-style grid positioning
    if (total === 1) {
      return baseStyle; // Single image fills container
    } else if (total === 2) {
      return baseStyle; // Both images get equal space
    } else if (total === 3) {
      if (index === 0) {
        return {
          ...baseStyle,
          gridRow: '1 / 3', // First image spans both rows (left side)
        };
      }
      return baseStyle; // Right side images
    } else if (total === 4) {
      return baseStyle; // Perfect 2x2 grid
    } else if (total === 5) {
      if (index === 0) {
        return {
          ...baseStyle,
          gridRow: '1 / 3', // First image spans both rows (left side)
        };
      }
      return baseStyle; // Right side images (4 small ones)
    } else if (total === 6) {
      return baseStyle; // Perfect 3x2 grid
    } else if (total >= 7) {
      // 7+ images: 3x3 grid
      return baseStyle;
    } else {
      return baseStyle;
    }
  };

  const getImageStyle = (isSingle: boolean = false): React.CSSProperties => {
    if (isSingle && !isMobile) {
      // Single image: natural size with responsive constraints
      return {
        maxWidth: '100%', // Responsive width
        height: 'auto', // Natural height
        objectFit: 'contain' as const, // Maintain aspect ratio
        transition: 'transform 0.3s ease, filter 0.2s ease',
        borderRadius: '0.5rem'
      };
    }

    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      transition: 'transform 0.3s ease, filter 0.2s ease'
    };
  };

  // Render single image with Facebook-style blurred background
  const renderSingleImage = (image: string, index: number) => {
    if (isMobile) {
      // Mobile: regular single image without blur
      return (
        <ImageDisplay
          imagePath={image}
          alt={`${altPrefix} - Image ${index + 1}`}
          style={getImageStyle(false)}
          userRole={userRole}
        />
      );
    }

    // Desktop: Facebook-style with blurred background on left and right sides
    return (
      <>
        {/* Left side blurred background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%', // Cover left 30% of container
            bottom: 0,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.2)', // Slightly larger to avoid blur edges
            zIndex: 1
          }}
        />
        {/* Right side blurred background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '30%', // Cover right 30% of container
            bottom: 0,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.2)', // Slightly larger to avoid blur edges
            zIndex: 1
          }}
        />
        {/* Main centered image - no blur overlay */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          <ImageDisplay
            imagePath={image}
            alt={`${altPrefix} - Image ${index + 1}`}
            style={getImageStyle(true)}
            userRole={userRole}
          />
        </div>
      </>
    );
  };

  return (
    <div>
      {/* Facebook-style Image Grid */}
      <div style={getGridStyle(displayImages.length)}>
        {displayImages.map((image, index) => {
          const isLastVisible = index === displayImages.length - 1;
          const showOverlay = isLastVisible && remainingCount > 0;

          return (
            <div
              key={index}
              style={getImageContainerStyle(index, displayImages.length)}
              onClick={() => handleImageClick(index)}
            >
              {displayImages.length === 1 ? (
                // Special rendering for single image
                renderSingleImage(image, index)
              ) : (
                // Regular rendering for multiple images
                <ImageDisplay
                  imagePath={image}
                  alt={`${altPrefix} - Image ${index + 1}`}
                  style={getImageStyle(false)}
                  userRole={userRole}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                />
              )}

              {/* Overlay for remaining images count */}
              {showOverlay && (
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
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '600',
                  backdropFilter: 'blur(2px)'
                }}>
                  +{remainingCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacebookImageGallery;
