import React, { useState, useEffect } from 'react';
import { formatCommentDate, formatCommentDateSync } from '../../hooks/useComments';

interface ServerTimeDisplayProps {
  timestamp: string;
  fallbackFormat?: 'sync' | 'basic';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ServerTimeDisplay Component
 * 
 * Displays formatted timestamps using secure server time to prevent
 * client-side time manipulation. Falls back to basic formatting if
 * server time is unavailable.
 */
const ServerTimeDisplay: React.FC<ServerTimeDisplayProps> = ({
  timestamp,
  fallbackFormat = 'sync',
  className,
  style
}) => {
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const formatTime = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Use server-side time formatting
        const formatted = await formatCommentDate(timestamp);
        setFormattedTime(formatted);
      } catch (err) {
        console.warn('Failed to format time with server time, using fallback:', err);
        setError(true);
        
        // Fallback to synchronous formatting
        if (fallbackFormat === 'sync') {
          setFormattedTime(formatCommentDateSync(timestamp));
        } else {
          // Basic fallback
          const date = new Date(timestamp);
          setFormattedTime(date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    if (timestamp) {
      formatTime();
    }
  }, [timestamp, fallbackFormat]);

  if (loading) {
    return (
      <span className={className} style={style}>
        ...
      </span>
    );
  }

  return (
    <span 
      className={className} 
      style={style}
      title={error ? 'Time displayed using fallback method' : 'Time synchronized with server'}
    >
      {formattedTime}
    </span>
  );
};

export default ServerTimeDisplay;
