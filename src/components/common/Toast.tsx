import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#22c55e" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      case 'warning':
        return <AlertCircle size={20} color="#f59e0b" />;
      case 'info':
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'error':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      case 'info':
      default:
        return '#eff6ff';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#bbf7d0';
      case 'error':
        return '#fecaca';
      case 'warning':
        return '#fed7aa';
      case 'info':
      default:
        return '#bfdbfe';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        minWidth: '320px',
        maxWidth: '480px',
        backgroundColor: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        transform: `translateX(${isVisible && !isExiting ? '0' : '100%'})`,
        opacity: isVisible && !isExiting ? 1 : 0,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <div style={{ flexShrink: 0, marginTop: '0.125rem' }}>
          {getIcon()}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: message ? '0.25rem' : 0
          }}>
            {title}
          </div>
          
          {message && (
            <div style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              lineHeight: '1.4'
            }}>
              {message}
            </div>
          )}
        </div>
        
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
