import React, { useState, useEffect, useRef } from 'react';
import type { CalendarEvent } from '../../types/calendar.types';
import { getImageUrl } from '../../config/constants';
import '../../styles/tv.css';

interface TVCalendarEventProps {
  event: CalendarEvent;
}

const TVCalendarEvent: React.FC<TVCalendarEventProps> = ({ event }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format date range if end date exists
  const formatDateRange = () => {
    const startDate = new Date(event.event_date);
    
    if (event.end_date) {
      const endDate = new Date(event.end_date);
      const startFormatted = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const endFormatted = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${startFormatted} - ${endFormatted}`;
    }
    
    return formatDate(event.event_date);
  };

  // Calculate days until event
  const getDaysUntilEvent = () => {
    const today = new Date();
    const eventDate = new Date(event.event_date);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  // Get category color - keep original colors
  const getCategoryColor = () => {
    if (event.category_color) {
      return event.category_color;
    }
    return '#e74c3c'; // Keep original red for events
  };

  // Determine event type text
  const getEventIcon = () => {
    if (event.is_holiday) return 'HOLIDAY';
    if (event.is_recurring) return 'RECURRING';
    if (event.is_alert) return 'ALERT';
    return 'EVENT';
  };

  // Check if event is today or upcoming soon
  const isUpcoming = () => {
    const today = new Date();
    const eventDate = new Date(event.event_date);
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // Next 7 days
  };

  // No truncation needed - using auto-scroll instead

  // Get event images
  const getEventImages = () => {
    const images: { url: string; alt: string }[] = [];

    // Check if event has images (from API response)
    if ((event as any).images && Array.isArray((event as any).images)) {
      (event as any).images.forEach((img: any, index: number) => {
        if (img.file_path) {
          const imageUrl = getImageUrl(img.file_path);
          if (imageUrl) {
            images.push({
              url: imageUrl,
              alt: `${event.title} - Image ${index + 1}`
            });
          }
        }
      });
    }

    return images;
  };

  const images = getEventImages();

  // Auto-rotate images if multiple images exist
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 4000); // Change image every 4 seconds

      return () => clearInterval(interval);
    }
  }, [images.length]);

  // Check if description needs scrolling and set up auto-scroll
  useEffect(() => {
    const checkScrollNeed = () => {
      if (descriptionRef.current && event.description) {
        const element = descriptionRef.current;
        const needsScroll = element.scrollHeight > element.clientHeight;
        setShouldScroll(needsScroll);

        if (needsScroll) {
          // Start auto-scroll after 2 seconds
          const startScrollTimeout = setTimeout(() => {
            element.style.animation = 'none'; // Reset animation
            void element.offsetHeight; // Trigger reflow (void to satisfy ESLint)
            element.style.animation = `autoScroll ${Math.max(10, element.scrollHeight / 20)}s linear infinite`;
          }, 2000);

          return () => clearTimeout(startScrollTimeout);
        }
      }
    };

    checkScrollNeed();
  }, [event.description, images.length]);

  return (
    <div style={{
      background: isUpcoming()
        ? 'linear-gradient(135deg, #fefce8 0%, #ffffff 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
      borderRadius: '20px',
      padding: '2rem',
      margin: '1.5rem 0',
      boxShadow: isUpcoming()
        ? '0 10px 30px rgba(245, 158, 11, 0.2)'
        : '0 10px 30px rgba(0, 0, 0, 0.1)',
      border: isUpcoming()
        ? '4px solid #f59e0b'
        : `3px solid ${getCategoryColor()}`,
      position: 'relative',
      overflow: 'hidden',
      maxHeight: '85vh',
      display: images.length > 0 ? 'flex' : 'block', // Conditional layout
      gap: images.length > 0 ? '2rem' : '0',
      alignItems: images.length > 0 ? 'stretch' : 'normal'
    }}>
      {/* Content Section - Full width if no images, 60% if images exist */}
      <div style={{
        flex: images.length > 0 ? '0 0 60%' : '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Upcoming event indicator */}
        {isUpcoming() && (
          <div style={{
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '20px',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 8px 25px rgba(231, 76, 60, 0.3)',
            marginBottom: '1.5rem',
            alignSelf: 'flex-start'
          }}>
            UPCOMING EVENT
          </div>
        )}
        {/* Event type indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '1.2rem',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '0.8rem',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            {getEventIcon()}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {event.is_holiday && (
              <span style={{
                background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                color: 'white',
                padding: '0.8rem 1.5rem',
                borderRadius: '15px',
                fontSize: '1.4rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 15px rgba(243, 156, 18, 0.3)'
              }}>
                HOLIDAY
              </span>
            )}
            {event.is_alert && (
              <span style={{
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                color: 'white',
                padding: '0.8rem 1.5rem',
                borderRadius: '15px',
                fontSize: '1.4rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
              }}>
                IMPORTANT
              </span>
            )}
          </div>
        </div>

        {/* Event title - Larger when no images */}
        <h2 style={{
          fontSize: images.length > 0 ? '3rem' : '4rem',
          fontWeight: '700',
          margin: '0 0 1.5rem 0',
          color: '#2c3e50',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          wordWrap: 'break-word',
          textAlign: images.length > 0 ? 'left' : 'center'
        }}>
          {event.title}
        </h2>

        {/* Event date with countdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          margin: '1.5rem 0',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          border: '2px solid rgba(231, 76, 60, 0.2)',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '1.8rem',
            background: `linear-gradient(135deg, ${getCategoryColor()}, ${getCategoryColor()}dd)`,
            color: 'white',
            padding: '1rem',
            borderRadius: '15px',
            boxShadow: `0 6px 15px ${getCategoryColor()}40`,
            fontWeight: 'bold'
          }}>
            DATE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
            <span style={{
              fontSize: '2.2rem',
              fontWeight: '700',
              color: '#2c3e50'
            }}>
              {formatDateRange()}
            </span>
            <span style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: isUpcoming() ? '#27ae60' : '#7f8c8d',
              background: isUpcoming() ? 'rgba(39, 174, 96, 0.1)' : 'rgba(127, 140, 141, 0.1)',
              padding: '0.6rem 1rem',
              borderRadius: '10px',
              display: 'inline-block'
            }}>
              {getDaysUntilEvent()}
            </span>
          </div>
        </div>

        {/* Event description - Auto-scrolling for long text */}
        {event.description && (
          <div
            ref={descriptionRef}
            style={{
              fontSize: images.length > 0 ? '2rem' : '2.6rem',
              lineHeight: '1.6',
              color: '#374151',
              background: 'rgba(255, 255, 255, 0.8)',
              padding: images.length > 0 ? '1.5rem' : '2rem',
              borderRadius: '15px',
              border: '2px solid rgba(231, 76, 60, 0.2)',
              wordWrap: 'break-word',
              flex: 1,
              marginBottom: '1.5rem',
              textAlign: images.length > 0 ? 'left' : 'center',
              maxHeight: images.length > 0 ? '250px' : '350px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {event.description}

            {/* Scrolling indicator */}
            {shouldScroll && (
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(231, 76, 60, 0.8)',
                color: 'white',
                padding: '0.3rem 0.6rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                SCROLLING
              </div>
            )}
          </div>
        )}

        {/* Category and metadata */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {event.category_name && (
            <div style={{
              background: `linear-gradient(135deg, ${getCategoryColor()}, ${getCategoryColor()}dd)`,
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '1.4rem',
              boxShadow: `0 4px 10px ${getCategoryColor()}40`,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              alignSelf: 'flex-start'
            }}>
              {event.category_name}
            </div>
          )}

          {/* Creator information */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '1.4rem',
            color: '#6b7280'
          }}>
            {event.created_by_name && (
              <span style={{ color: '#e74c3c', fontWeight: '600' }}>
                By: {event.created_by_name}
              </span>
            )}
          </div>
        </div>
      </div>



      {/* Event metadata */}
      <div className="tv-event-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Category */}
          {event.category_name && (
            <span 
              style={{
                background: getCategoryColor(),
                color: 'white',
                padding: '0.8rem 1.5rem',
                borderRadius: '25px',
                fontWeight: '600',
                fontSize: '1.6rem'
              }}
            >
              {event.category_name}
            </span>
          )}

          {/* Subcategory */}
          {event.subcategory_name && (
            <span style={{
              background: event.subcategory_color || '#95a5a6',
              color: 'white',
              padding: '0.6rem 1.2rem',
              borderRadius: '20px',
              fontSize: '1.4rem'
            }}>
              {event.subcategory_name}
            </span>
          )}

          {/* Recurring indicator */}
          {event.is_recurring && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.6rem',
              color: '#8e44ad'
            }}>
              <span style={{ fontWeight: 'bold' }}>REPEATS:</span>
              <span>
                {event.recurrence_pattern === 'yearly' && 'Yearly'}
                {event.recurrence_pattern === 'monthly' && 'Monthly'}
                {event.recurrence_pattern === 'weekly' && 'Weekly'}
              </span>
            </div>
          )}
        </div>

        {/* Created by information */}
        {event.created_by_name && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            fontSize: '1.6rem'
          }}>
            <span style={{ opacity: 0.7 }}>Organized by:</span>
            <span style={{ fontWeight: '600' }}>
              {event.created_by_name}
            </span>
          </div>
        )}
      </div>

      {/* Right Side - Images (40% width) */}
      {images.length > 0 && (
        <div style={{
          flex: '0 0 40%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: '400px'
        }}>
          {/* Single Image or Current Image from Carousel */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '0px', // Removed border radius to show full image
            overflow: 'hidden',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
            border: `4px solid ${getCategoryColor()}`,
            position: 'relative'
          }}>
            <img
              src={images[currentImageIndex].url}
              alt={images[currentImageIndex].alt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'opacity 0.5s ease-in-out'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />

            {/* Image counter for multiple images */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Auto-rotation indicator */}
            {images.length > 1 && (
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(231, 76, 60, 0.8)',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '50%',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                AUTO
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TVCalendarEvent;
