import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import '../../styles/tv.css';

interface TVSlideshowProps {
  children: React.ReactNode[];
  autoPlayInterval?: number; // in milliseconds
  showProgress?: boolean;
  className?: string;
  isPlaying?: boolean;
  onSlideChange?: (slideIndex: number) => void;
}

interface TVSlideshowRef {
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  getCurrentSlide: () => number;
}

const TVSlideshow = forwardRef<TVSlideshowRef, TVSlideshowProps>(({
  children,
  autoPlayInterval = 12000, // 12 seconds default
  showProgress = true,
  className = '',
  isPlaying = true,
  onSlideChange
}, ref) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  const totalSlides = children.length;

  // Go to next slide
  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    const newSlide = (currentSlide + 1) % totalSlides;
    setCurrentSlide(newSlide);
    setProgress(0);
    onSlideChange?.(newSlide);
  }, [totalSlides, currentSlide, onSlideChange]);

  // Go to previous slide
  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    const newSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    setCurrentSlide(newSlide);
    setProgress(0);
    onSlideChange?.(newSlide);
  }, [totalSlides, currentSlide, onSlideChange]);

  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
      setProgress(0);
      onSlideChange?.(index);
    }
  }, [totalSlides, onSlideChange]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    nextSlide,
    prevSlide,
    goToSlide,
    getCurrentSlide: () => currentSlide
  }), [nextSlide, prevSlide, goToSlide, currentSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, autoPlayInterval, nextSlide, totalSlides]);

  // Progress bar animation
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (autoPlayInterval / 100);
        return prev + increment;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [currentSlide, isPlaying, autoPlayInterval, totalSlides]);

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
  }, [currentSlide]);

  // Pause/resume on hover (optional for TV display)
  const handleMouseEnter = () => {
    // Hover pause disabled for TV display - controlled externally
  };

  const handleMouseLeave = () => {
    // Hover resume disabled for TV display - controlled externally
  };

  // Handle keyboard navigation (for testing)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'ArrowRight':
          nextSlide();
          break;
        case ' ':
          // Space key disabled for TV display - controlled externally
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide, isPlaying]);

  // Don't render if no slides
  if (totalSlides === 0) {
    return (
      <div className="tv-no-content">
        <div style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold', color: '#6c757d' }}>EMPTY</div>
        <div>No content available to display</div>
      </div>
    );
  }

  // Single slide - no slideshow needed
  if (totalSlides === 1) {
    return (
      <div className={`tv-slideshow ${className}`}>
        <div className="tv-slide active">
          {children[0]}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`tv-slideshow ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      {children.map((child, index) => (
        <div
          key={index}
          className={`tv-slide ${
            index === currentSlide 
              ? 'active' 
              : index === (currentSlide - 1 + totalSlides) % totalSlides 
                ? 'prev' 
                : ''
          }`}
          style={{
            zIndex: index === currentSlide ? 10 : 1
          }}
        >
          {child}
        </div>
      ))}

      {/* Progress indicators */}
      {showProgress && totalSlides > 1 && (
        <div className="tv-progress">
          {children.map((_, index) => (
            <div
              key={index}
              className={`tv-progress-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Progress bar for current slide */}
              {index === currentSlide && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${Math.min(progress, 100)}%`,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    transition: 'width 0.1s linear'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}



      {/* Navigation arrows (hidden by default, can be shown for testing) */}
      <div style={{
        position: 'fixed',
        bottom: '6rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'none', // Hidden for TV display
        gap: '2rem',
        zIndex: 1000
      }}>
        <button
          onClick={prevSlide}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '2rem',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        <button
          onClick={() => {/* Play/pause controlled externally */}}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '1.5rem',
            cursor: 'pointer',
            display: 'none' // Hidden for TV display
          }}
        >
          {isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          onClick={nextSlide}
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '2rem',
            cursor: 'pointer'
          }}
        >
          →
        </button>
      </div>
    </div>
  );
});

export default TVSlideshow;
