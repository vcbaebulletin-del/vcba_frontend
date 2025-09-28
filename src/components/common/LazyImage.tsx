import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../config/constants';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  width,
  height,
  quality = 80,
  format = 'webp',
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URL
  const getOptimizedImageUrl = (originalSrc: string) => {
    if (!originalSrc) return '';
    
    const apiUrl = API_BASE_URL;
    const baseUrl = originalSrc.startsWith('/') ? `${apiUrl}${originalSrc}` : originalSrc;
    
    // Don't optimize external images or if no optimization parameters
    if (!originalSrc.startsWith('/') || (!width && !height && quality === 80 && format === 'webp')) {
      return baseUrl;
    }

    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    if (quality !== 80) params.append('q', quality.toString());
    if (format !== 'webp') params.append('f', format);

    return `${baseUrl}?${params.toString()}`;
  };

  // Generate placeholder image URL (low quality, small size)
  const getPlaceholderUrl = (originalSrc: string) => {
    if (placeholder) return placeholder;
    if (!originalSrc.startsWith('/')) return '';
    
    const apiUrl = API_BASE_URL;
    const baseUrl = `${apiUrl}${originalSrc}`;
    const params = new URLSearchParams({
      w: '50',
      h: '50',
      q: '20',
      f: 'webp'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string) => {
    if (!originalSrc.startsWith('/') || !width) return '';
    
    const apiUrl = API_BASE_URL;
    const baseUrl = `${apiUrl}${originalSrc}`;
    
    const sizes = [
      { w: Math.round(width * 0.5), density: '1x' },
      { w: width, density: '2x' },
      { w: Math.round(width * 1.5), density: '3x' }
    ];

    return sizes.map(size => {
      const params = new URLSearchParams({
        w: size.w.toString(),
        q: quality.toString(),
        f: format
      });
      return `${baseUrl}?${params.toString()} ${size.density}`;
    }).join(', ');
  };

  const optimizedSrc = getOptimizedImageUrl(src);
  const placeholderSrc = getPlaceholderUrl(src);
  const srcSet = generateSrcSet(src);

  return (
    <div 
      className={`lazy-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Placeholder image */}
      {placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className="lazy-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(5px)',
            transform: 'scale(1.1)',
            opacity: hasError ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : ''}
        srcSet={isInView && srcSet ? srcSet : ''}
        alt={alt}
        className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
          display: hasError ? 'none' : 'block'
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />

      {/* Error fallback */}
      {hasError && (
        <div
          className="lazy-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}
        >
          Image not available
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <div
          className="lazy-image-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        .lazy-image-container {
          background-color: #f9fafb;
        }
        
        .lazy-image.loaded {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Responsive image optimization */
        @media (max-width: 768px) {
          .lazy-image-container {
            /* Optimize for mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default LazyImage;
