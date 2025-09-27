import React from 'react';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Professional Error Component for Missing Notification Targets
 * Displays user-friendly messages when notification targets are not found
 */

interface NotificationTargetErrorProps {
  type: 'announcement' | 'comment' | 'calendar' | 'general';
  title?: string;
  message?: string;
  userRole: 'admin' | 'student';
  onRetry?: () => void;
  className?: string;
}

const NotificationTargetError: React.FC<NotificationTargetErrorProps> = ({
  type,
  title,
  message,
  userRole,
  onRetry,
  className = ''
}) => {
  const navigate = useNavigate();

  // Get appropriate error messages based on type
  const getErrorContent = () => {
    switch (type) {
      case 'announcement':
        return {
          title: title || 'Announcement Not Found',
          message: message || 'This announcement is no longer available or has been removed.',
          icon: '📢'
        };
      case 'comment':
        return {
          title: title || 'Comment Not Found',
          message: message || 'This comment is no longer available or has been removed.',
          icon: '💬'
        };
      case 'calendar':
        return {
          title: title || 'Event Not Found',
          message: message || 'This calendar event is no longer available or has been removed.',
          icon: '📅'
        };
      default:
        return {
          title: title || 'Content Not Found',
          message: message || 'The content you\'re looking for is no longer available.',
          icon: '❓'
        };
    }
  };

  const errorContent = getErrorContent();
  const dashboardRoute = userRole === 'admin' ? '/admin/announcement-approval' : '/student/newsfeed';
  const newsfeedRoute = userRole === 'admin' ? '/admin/newsfeed' : '/student/newsfeed';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(dashboardRoute);
    }
  };

  const handleGoToNewsfeed = () => {
    navigate(newsfeedRoute);
  };

  const handleGoToDashboard = () => {
    navigate(dashboardRoute);
  };

  return (
    <div className={`notification-target-error ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%)',
      border: '1px solid #fecaca',
      borderRadius: '16px',
      margin: '2rem auto',
      maxWidth: '600px',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
    }}>
      {/* Error Icon */}
      <div style={{
        fontSize: '4rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <span>{errorContent.icon}</span>
        <AlertTriangle size={48} color="#dc2626" />
      </div>

      {/* Error Title */}
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#dc2626',
        marginBottom: '0.5rem',
        margin: 0
      }}>
        {errorContent.title}
      </h2>

      {/* Error Message */}
      <p style={{
        fontSize: '1rem',
        color: '#6b7280',
        marginBottom: '2rem',
        lineHeight: '1.6',
        maxWidth: '400px'
      }}>
        {errorContent.message}
      </p>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Retry Button (if retry function provided) */}
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Try Again
          </button>
        )}

        {/* Go Back Button */}
        <button
          onClick={handleGoBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4b5563';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6b7280';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ArrowLeft size={16} />
          Go Back
        </button>

        {/* Go to Newsfeed Button */}
        <button
          onClick={handleGoToNewsfeed}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#059669';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#10b981';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          View Newsfeed
        </button>

        {/* Go to Dashboard Button */}
        <button
          onClick={handleGoToDashboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Home size={16} />
          Dashboard
        </button>
      </div>

      {/* Additional Help Text */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.1)'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: '#4b5563',
          margin: 0,
          lineHeight: '1.5'
        }}>
          💡 <strong>Tip:</strong> Content may have been removed by an administrator or may no longer be available. 
          Try checking the newsfeed for the latest updates.
        </p>
      </div>
    </div>
  );
};

export default NotificationTargetError;
