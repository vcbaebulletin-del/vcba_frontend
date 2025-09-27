import React, { useState, useEffect, useRef } from 'react';
import type { Announcement } from '../../types/announcement.types';
import { getImageUrl } from '../../config/constants';
import { formatDate, formatTime } from '../../utils/timezone';
import '../../styles/tv.css';

interface TVAnnouncementProps {
  announcement: Announcement;
}

const TVAnnouncement: React.FC<TVAnnouncementProps> = ({ announcement }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  // Format functions now use Philippines timezone utilities

  // No truncation needed - using auto-scroll instead

  // Get category color - keep original button colors
  const getCategoryColor = () => {
    if (announcement.category_color) {
      return announcement.category_color;
    }
    return '#3498db'; // Keep original blue for buttons
  };

  // Determine if announcement is urgent/alert
  const isUrgent = announcement.is_alert || announcement.is_pinned;

  // Get announcement images
  const getAnnouncementImages = () => {
    const images = [];

    // Primary image from image_path
    if (announcement.image_path) {
      const imageUrl = getImageUrl(announcement.image_path);
      if (imageUrl) {
        images.push({
          url: imageUrl,
          alt: `${announcement.title} - Image`
        });
      }
    }

    // Primary image from image_url (fallback)
    if (announcement.image_url && !announcement.image_path) {
      images.push({
        url: announcement.image_url,
        alt: `${announcement.title} - Image`
      });
    }

    // Additional images from attachments
    if (announcement.attachments) {
      announcement.attachments.forEach((attachment, index) => {
        if (attachment.file_path && attachment.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const imageUrl = getImageUrl(attachment.file_path);
          if (imageUrl) {
            images.push({
              url: imageUrl,
              alt: `${announcement.title} - Image ${index + 2}`
            });
          }
        }
      });
    }

    return images;
  };

  const images = getAnnouncementImages();

  // Auto-rotate images if multiple images exist
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 4000); // Change image every 4 seconds

      return () => clearInterval(interval);
    }
  }, [images.length]);

  // Check if content needs scrolling and set up auto-scroll
  useEffect(() => {
    const checkScrollNeed = () => {
      if (contentRef.current) {
        const element = contentRef.current;
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
  }, [announcement.content, images.length]);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f9fdf4 100%)',
      borderRadius: '20px',
      padding: '2rem',
      margin: '1.5rem 0',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      border: isUrgent ? '4px solid #e74c3c' : `3px solid ${getCategoryColor()}`,
      position: 'relative',
      overflow: 'hidden',
      height: 'auto',
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
        {/* Alert indicator - keep original red color */}
        {isUrgent && (
          <div style={{
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '15px',
            marginBottom: '1.5rem',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 6px 20px rgba(231, 76, 60, 0.4)'
          }}>
            {announcement.is_alert ? 'IMPORTANT ALERT' : 'PINNED'}
          </div>
        )}

        {/* Announcement title - Larger when no images */}
        <h2 style={{
          fontSize: images.length > 0 ? '3.2rem' : '4rem',
          fontWeight: '700',
          margin: '0 0 1.5rem 0',
          color: '#1f2937',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          wordWrap: 'break-word',
          textAlign: images.length > 0 ? 'left' : 'center'
        }}>
          {announcement.title}
        </h2>

        {/* Announcement content - Auto-scrolling for long text */}
        <div
          ref={contentRef}
          style={{
            fontSize: images.length > 0 ? '2.2rem' : '2.8rem',
            lineHeight: '1.6',
            color: '#374151',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: images.length > 0 ? '1.5rem' : '2rem',
            borderRadius: '15px',
            border: '2px solid rgba(39, 174, 96, 0.2)',
            wordWrap: 'break-word',
            flex: 1,
            marginBottom: '1.5rem',
            textAlign: images.length > 0 ? 'left' : 'center',
            maxHeight: images.length > 0 ? '300px' : '400px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {announcement.content}

          {/* Scrolling indicator */}
          {shouldScroll && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(39, 174, 96, 0.8)',
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

        {/* Metadata */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Category */}
          {announcement.category_name && (
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
              {announcement.category_name}
            </div>
          )}

          {/* Date, time, and author */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            fontSize: '1.4rem',
            color: '#6b7280'
          }}>
            <span>Date: {formatDate(announcement.created_at)}</span>
            <span>Time: {formatTime(announcement.created_at)}</span>
            {announcement.author_name && (
              <span style={{ color: '#27ae60', fontWeight: '600' }}>
                By: {announcement.author_name}
              </span>
            )}
          </div>
        </div>
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
            border: '4px solid #3498db',
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
                background: 'rgba(39, 174, 96, 0.8)',
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

      {/* Engagement indicators (if available) */}
      {(announcement.reaction_count || announcement.comment_count) && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '10px',
          display: 'flex',
          gap: '3rem',
          fontSize: '1.8rem'
        }}>
          {announcement.reaction_count && announcement.reaction_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>LIKES:</span>
              <span>{announcement.reaction_count}</span>
            </div>
          )}
          {announcement.comment_count && announcement.comment_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', color: '#3498db' }}>COMMENTS:</span>
              <span>{announcement.comment_count}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TVAnnouncement;
