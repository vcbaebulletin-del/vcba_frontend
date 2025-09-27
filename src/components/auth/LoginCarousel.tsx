import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import welcomePageService, { CarouselImage } from '../../services/welcomePageService';
import LazyImage from '../common/LazyImage';

interface LoginCarouselProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
}

const LoginCarousel: React.FC<LoginCarouselProps> = ({
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  className = '',
}) => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Load carousel images
  const loadCarouselImages = useCallback(async () => {
    try {
      setLoading(true);
      const carouselImages = await welcomePageService.getCarouselImages();
      
      if (carouselImages.length > 0) {
        setImages(carouselImages);
        // Preload images for better performance
        const imagePaths = carouselImages.map(img => img.image);
        welcomePageService.preloadImages(imagePaths);
      } else {
        setError('No carousel images available');
      }
    } catch (err) {
      console.error('Error loading carousel images:', err);
      setError('Failed to load carousel images');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, images.length, isHovered]);

  // Load images on mount
  useEffect(() => {
    loadCarouselImages();
  }, [loadCarouselImages]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (loading) {
    return (
      <div className={`login-carousel loading ${className}`}>
        <div className="carousel-loading">
          <div className="loading-spinner"></div>
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  if (error || images.length === 0) {
    return (
      <div className={`login-carousel error ${className}`}>
        <div className="carousel-error">
          <p>Unable to load carousel images</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`login-carousel ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="carousel-container">
        <div className="carousel-track">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
              style={{
                transform: `translateX(${(index - currentIndex) * 100}%)`,
              }}
            >
              <LazyImage
                src={welcomePageService.getImageUrl(image.image)}
                alt={`Carousel image ${index + 1}`}
                className="carousel-image"
                width={800}
                height={600}
                quality={85}
                format="webp"
              />
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        {showControls && images.length > 1 && (
          <>
            <button
              className="carousel-control prev"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="carousel-control next"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Indicators */}
        {showIndicators && images.length > 1 && (
          <div className="carousel-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .login-carousel {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 12px;
          background: #f3f4f6;
        }

        .carousel-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .carousel-track {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .carousel-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: transform 0.5s ease-in-out;
        }

        .carousel-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .carousel-control {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 2;
          opacity: 0;
        }

        .login-carousel:hover .carousel-control {
          opacity: 1;
        }

        .carousel-control:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-control.prev {
          left: 16px;
        }

        .carousel-control.next {
          right: 16px;
        }

        .carousel-indicators {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 2;
        }

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.5);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: white;
          border-color: white;
        }

        .indicator:hover {
          border-color: white;
          background: rgba(255, 255, 255, 0.7);
        }

        /* Loading state */
        .login-carousel.loading,
        .login-carousel.error {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }

        .carousel-loading,
        .carousel-error {
          text-align: center;
          color: #6b7280;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #22c55e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .carousel-loading p,
        .carousel-error p {
          margin: 0;
          font-size: 14px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .carousel-control {
            width: 40px;
            height: 40px;
          }

          .carousel-control.prev {
            left: 12px;
          }

          .carousel-control.next {
            right: 12px;
          }

          .carousel-indicators {
            bottom: 12px;
          }

          .indicator {
            width: 10px;
            height: 10px;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .carousel-slide {
            transition: none;
          }
        }

        /* Focus styles for accessibility */
        .carousel-control:focus,
        .indicator:focus {
          outline: 2px solid #22c55e;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default LoginCarousel;
