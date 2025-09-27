import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { calendarReactionService } from '../../services/calendarReactionService';
import { adminHttpClient, studentHttpClient } from '../../services/api.service';

interface CalendarEventLikeButtonProps {
  eventId: number;
  initialLiked: boolean;
  initialCount: number;
  userRole?: 'admin' | 'student'; // Add role prop for explicit role handling
  onLikeChange?: (liked: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

const CalendarEventLikeButton: React.FC<CalendarEventLikeButtonProps> = ({
  eventId,
  initialLiked,
  initialCount,
  userRole,
  onLikeChange,
  size = 'medium',
  showCount = true
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const sizeConfig = {
    small: { iconSize: 14, fontSize: '0.75rem', padding: '0.25rem 0.5rem' },
    medium: { iconSize: 16, fontSize: '0.875rem', padding: '0.5rem 0.75rem' },
    large: { iconSize: 18, fontSize: '1rem', padding: '0.75rem 1rem' }
  };

  const config = sizeConfig[size];

  // Role-aware calendar reaction function
  const toggleCalendarReaction = async (eventId: number, currentlyLiked: boolean) => {
    if (userRole) {
      // Use role-specific client if role is provided
      const client = userRole === 'admin' ? adminHttpClient : studentHttpClient;
      const endpoint = `/api/calendar/${eventId}/like`;

      console.log(`[DEBUG] CalendarEventLikeButton ${userRole} making direct API call to:`, endpoint);

      if (currentlyLiked) {
        return await client.delete(endpoint);
      } else {
        return await client.post(endpoint, {});
      }
    } else {
      // Fallback to original service if no role provided (backward compatibility)
      return await calendarReactionService.toggleLike(eventId, currentlyLiked);
    }
  };

  const handleToggleLike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await toggleCalendarReaction(eventId, liked);

      if (response.success) {
        const newLiked = !liked;
        const newCount = newLiked ? count + 1 : count - 1;

        setLiked(newLiked);
        setCount(Math.max(0, newCount)); // Ensure count doesn't go below 0

        // Notify parent component
        if (onLikeChange) {
          onLikeChange(newLiked, newCount);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Could add toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: config.padding,
        backgroundColor: liked ? '#fef2f2' : 'transparent',
        border: liked ? '1px solid #fecaca' : '1px solid #e5e7eb',
        borderRadius: '0.375rem',
        color: liked ? '#dc2626' : '#6b7280',
        fontSize: config.fontSize,
        fontWeight: '500',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: loading ? 0.6 : 1
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = liked ? '#fee2e2' : '#f9fafb';
          e.currentTarget.style.borderColor = liked ? '#fca5a5' : '#d1d5db';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.backgroundColor = liked ? '#fef2f2' : 'transparent';
          e.currentTarget.style.borderColor = liked ? '#fecaca' : '#e5e7eb';
        }
      }}
      title={liked ? 'Unlike this event' : 'Like this event'}
    >
      <Heart
        size={config.iconSize}
        fill={liked ? 'currentColor' : 'none'}
        style={{
          transition: 'all 0.2s ease-in-out',
          transform: loading ? 'scale(0.9)' : 'scale(1)'
        }}
      />
      {showCount && (
        <span style={{ minWidth: '1rem', textAlign: 'left' }}>
          {count}
        </span>
      )}
    </button>
  );
};

export default CalendarEventLikeButton;
