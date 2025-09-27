import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../config/constants';

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
        console.log('🔄 Fetching image via CORS-safe method:', imagePath);

        // Fetch image as blob to bypass CORS restrictions
        const response = await fetch(imagePath, {
          method: 'GET',
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

// CORS-safe image component for lightbox
interface SafeImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onLoad?: () => void;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt, style, onClick, onLoad }) => {
  const { imageUrl, loading, error } = useImageLoader(src);

  if (loading) {
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white'
      }}>
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        border: '2px dashed rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>🖼️</div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Image unavailable</div>
          {error && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#ccc' }}>
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
      onClick={onClick}
      onLoad={() => {
        console.log('✅ Image rendered successfully in lightbox');
        onLoad?.();
      }}
      draggable={false}
    />
  );
};

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  altPrefix?: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  altPrefix = 'Image'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset state when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
      setImageLoaded(false);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageLoaded(false);
    setIsZoomed(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageLoaded(false);
    setIsZoomed(false);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    setImageLoaded(false);
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
      onClick={onClose}
    >
      {/* Close Button - Mobile responsive */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: isMobile ? '1rem' : '1rem',
          right: isMobile ? '1rem' : '1rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
          height: isMobile ? '2.5rem' : '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 10001,
          backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <X size={isMobile ? 18 : 24} />
      </button>

      {/* Image Counter - Mobile responsive */}
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '1rem' : '1rem',
          left: isMobile ? '1rem' : '1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
          borderRadius: isMobile ? '1rem' : '1.25rem', // 16px mobile, 20px desktop
          fontSize: isMobile ? '0.75rem' : '0.875rem', // 12px mobile, 14px desktop
          fontWeight: '500',
          zIndex: 10001,
          backdropFilter: 'blur(4px)'
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>



      {/* Main Image Container */}
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: isMobile ? '60vh' : '70vh', // Reduced to leave space for bottom navigation
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '6rem' : '7rem' // Add margin to prevent overlap with bottom nav
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Main Image */}
        <div
          style={{
            position: 'relative',
            overflow: isZoomed ? 'auto' : 'hidden',
            borderRadius: '12px',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <SafeImage
            src={images[currentIndex]}
            alt={`${altPrefix} ${currentIndex + 1}`}
            style={{
              maxWidth: isZoomed ? 'none' : '90vw',
              maxHeight: isZoomed ? 'none' : isMobile ? '60vh' : '70vh', // Match container height
              width: isZoomed ? '150%' : 'auto',
              height: 'auto',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              cursor: isZoomed ? 'grab' : 'zoom-in'
            }}
            onLoad={() => setImageLoaded(true)}
            onClick={toggleZoom}
          />
        </div>

      </div>



      {/* Bottom Navigation Container - Previous, Thumbnails, Next */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: isMobile ? '1rem' : '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: isMobile ? '0.75rem' : '1rem',
            borderRadius: isMobile ? '0.75rem' : '0.75rem', // 12px consistent
            maxWidth: '90vw',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: isMobile ? '2.5rem' : '3rem', // Smaller than before
              height: isMobile ? '2.5rem' : '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ChevronLeft size={isMobile ? 16 : 20} />
          </button>

          {/* Thumbnail Navigation */}
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '0.375rem' : '0.5rem',
              overflowX: 'auto',
              maxWidth: isMobile ? 'calc(90vw - 6rem)' : 'calc(90vw - 8rem)', // Account for nav buttons
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none' // IE/Edge
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                style={{
                  width: isMobile ? '2.5rem' : '3.75rem', // 40px mobile, 60px desktop
                  height: isMobile ? '2.5rem' : '3.75rem',
                  borderRadius: isMobile ? '0.375rem' : '0.5rem', // 6px mobile, 8px desktop
                  cursor: 'pointer',
                  opacity: index === currentIndex ? 1 : 0.6,
                  border: index === currentIndex ? '2px solid white' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  minWidth: isMobile ? '2.5rem' : '3.75rem', // Prevent shrinking
                  flexShrink: 0
                }}
                onClick={() => goToImage(index)}
                onMouseEnter={(e) => {
                  if (!isMobile && index !== currentIndex) {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && index !== currentIndex) {
                    e.currentTarget.style.opacity = '0.6';
                  }
                }}
                onTouchStart={(e) => {
                  if (index !== currentIndex) {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onTouchEnd={(e) => {
                  if (index !== currentIndex) {
                    e.currentTarget.style.opacity = '0.6';
                  }
                }}
              >
                <SafeImage
                  src={image}
                  alt={`${altPrefix} ${index + 1} thumbnail`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNext}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: isMobile ? '2.5rem' : '3rem', // Smaller than before
              height: isMobile ? '2.5rem' : '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ChevronRight size={isMobile ? 16 : 20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
