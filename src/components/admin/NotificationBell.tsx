import React, { useState, useEffect } from 'react';
import { adminNotificationService, type Notification } from '../../services/notificationService';
import { useNotificationNavigation } from '../../hooks/useNotificationNavigation';
import { Bell, Megaphone, AlertTriangle, MessageCircle, Heart, Settings, Clock, CheckCircle } from 'lucide-react';
import '../../styles/notificationHighlight.css';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Enhanced mobile detection with better breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Increased breakpoint for better mobile experience
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize notification navigation
  const { handleNotificationClick } = useNotificationNavigation({
    userRole: 'admin',
    onNavigationStart: (notification) => {
      console.log('🚀 Starting navigation for notification:', notification.title);
      setIsOpen(false); // Close dropdown when navigating
    },
    onNavigationComplete: (notification, success) => {
      if (success) {
        console.log('✅ Navigation completed successfully');
        // Update notification as read in local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.notification_id === notification.notification_id
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('❌ Navigation failed');
      }
    },
    onNavigationError: (error, notification) => {
      console.error('🚨 Navigation error:', error, 'for notification:', notification.title);
      // Could show user-friendly error message here
    }
  });

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔔 Fetching notifications...');

      const [notificationsResponse, unreadResponse] = await Promise.all([
        adminNotificationService.getNotifications({ limit: 10, sort_by: 'created_at', sort_order: 'DESC' }),
        adminNotificationService.getUnreadCount()
      ]);

      if (notificationsResponse.success && notificationsResponse.data) {
        setNotifications(notificationsResponse.data.notifications);
        console.log('✅ Notifications loaded:', notificationsResponse.data.notifications.length);
      } else {
        console.warn('⚠️ Notifications response not successful:', notificationsResponse);
      }

      if (unreadResponse.success && unreadResponse.data) {
        setUnreadCount(unreadResponse.data.unreadCount);
        console.log('✅ Unread count loaded:', unreadResponse.data.unreadCount);
      } else {
        console.warn('⚠️ Unread count response not successful:', unreadResponse);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);

      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('Network connection failed')) {
        console.error('🚨 Backend connection issue detected. Please check if the server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle notification click with navigation
  const handleNotificationItemClick = async (notification: Notification) => {
    try {
      console.log('🔔 Admin notification clicked:', notification);
      await handleNotificationClick(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  // Mark notification as read (for mark all read functionality)
  const markAsRead = async (notificationId: number) => {
    try {
      await adminNotificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.notification_id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await adminNotificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get notification icon
  const getNotificationIcon = (type: number): React.ComponentType<{ size?: number; color?: string }> => {
    const icons: Record<number, React.ComponentType<{ size?: number; color?: string }>> = {
      1: Megaphone,     // announcement
      2: AlertTriangle, // alert
      3: MessageCircle, // comment
      4: Heart,         // reaction
      5: Settings,      // system
      6: Clock,         // reminder
      14: CheckCircle   // announcement approval
    };
    return icons[type] || Bell;
  };

  // Clean notification title by replacing ??? with proper text based on notification type
  const cleanNotificationTitle = (title: string, typeId: number): string => {
    // If title doesn't contain ???, return as is
    if (!title.includes('???')) {
      return title;
    }

    // Replace ??? based on notification type
    const replacements: Record<number, string> = {
      1: '📢', // announcement - megaphone
      2: '🚨', // alert - siren
      3: '💬', // comment - speech bubble
      4: '❤️', // reaction - heart
      5: '⚙️', // system - gear
      6: '⏰'  // reminder - clock
    };

    // Get the replacement emoji or use a default
    const emoji = replacements[typeId] || '🔔';

    // Replace all occurrences of ??? (which can be 4 question marks)
    return title.replace(/\?{4}/g, emoji).replace(/\?{3}/g, emoji).replace(/\?{2}/g, emoji);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Mobile Backdrop */}
      {isOpen && isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998 // Just below the notification panel
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notification Bell Button - Enhanced mobile responsive */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isMobile ? 'rgba(107, 114, 128, 0.05)' : 'none',
          border: isMobile ? '1px solid rgba(107, 114, 128, 0.2)' : 'none',
          cursor: 'pointer',
          padding: isMobile ? '0.75rem' : '0.5rem', // Increased padding on mobile
          borderRadius: isMobile ? '0.75rem' : '50%', // Rounded rectangle on mobile, circle on desktop
          transition: 'all 0.2s ease',
          minHeight: isMobile ? '3rem' : 'auto', // 48px minimum touch target - increased for better accessibility
          minWidth: isMobile ? '3rem' : 'auto',
          boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none', // Subtle shadow on mobile
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => {
          if (!isMobile) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseOut={(e) => {
          if (!isMobile) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.backgroundColor = isMobile ? 'rgba(107, 114, 128, 0.05)' : 'transparent';
        }}
      >
        <Bell size={isMobile ? 16 : 20} color="#2d5016" /> {/* Reduced size for better proportions */}

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: isMobile ? '0.125rem' : '0.25rem', // 2px mobile, 4px desktop
            right: isMobile ? '0.125rem' : '0.25rem',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: isMobile ? '1.125rem' : '1.25rem', // 18px mobile, 20px desktop
            height: isMobile ? '1.125rem' : '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '0.625rem' : '0.75rem', // 10px mobile, 12px desktop
            fontWeight: '600'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown - Enhanced mobile responsive */}
      {isOpen && (
        <div style={{
          position: isMobile ? 'fixed' : 'absolute',
          top: isMobile ? '0' : '100%',
          right: isMobile ? '0' : '0',
          left: isMobile ? '0' : 'auto',
          bottom: isMobile ? '0' : 'auto',
          width: isMobile ? '100vw' : '26rem', // Full width on mobile, 416px on desktop - increased for better content
          maxHeight: isMobile ? '100vh' : '36rem', // Full height on mobile, 576px on desktop - increased for better content
          background: 'white',
          border: isMobile ? 'none' : '1px solid #e5e7eb',
          borderRadius: isMobile ? '0' : '0.75rem', // No radius on mobile, 12px on desktop
          boxShadow: isMobile
            ? '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.1)' // Enhanced mobile shadow
            : '0 12px 32px rgba(0, 0, 0, 0.15)', // Enhanced desktop shadow
          zIndex: 9999, // Increased z-index to ensure it appears above all content including scrolling newsfeed
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...(isMobile && {
            backdropFilter: 'blur(8px)', // Modern backdrop blur effect on mobile
            WebkitBackdropFilter: 'blur(8px)' // Safari support
          })
        }}>
          {/* Header - Mobile responsive */}
          <div style={{
            padding: isMobile ? '1rem 1rem 0.75rem 1rem' : '1rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}>
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={20} color="#6b7280" />
              </button>
            )}
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? '1.25rem' : '1.125rem', // 20px mobile, 18px desktop - increased for better mobile readability
              fontWeight: '600',
              color: '#1f2937',
              flex: 1,
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: isMobile ? 'rgba(34, 197, 94, 0.1)' : 'none',
                  border: isMobile ? '1px solid rgba(34, 197, 94, 0.2)' : 'none',
                  color: '#22c55e',
                  fontSize: isMobile ? '0.875rem' : '0.875rem', // 14px consistent - increased for better mobile readability
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: isMobile ? '0.75rem 1rem' : '0.375rem 0.5rem', // Better mobile padding
                  borderRadius: isMobile ? '0.75rem' : '0.375rem', // 12px mobile, 6px desktop
                  minHeight: isMobile ? '3rem' : 'auto', // 48px touch target - increased
                  transition: 'all 0.2s ease'
                }}
              >
                {isMobile ? 'Mark all' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notifications List - Mobile responsive */}
          <div style={{
            maxHeight: isMobile ? 'calc(100vh - 10rem)' : '25rem', // Increased space for mobile header
            overflowY: 'auto',
            flex: 1,
            minHeight: isMobile ? '20rem' : 'auto' // Ensure minimum height on mobile
          }}>
            {loading ? (
              <div style={{
                padding: isMobile ? '1.5rem' : '2rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '1rem', // 14px mobile, 16px desktop
                  lineHeight: '1.5'
                }}>
                  Loading notifications...
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: isMobile ? '1.5rem' : '2rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <div style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <Bell size={isMobile ? 40 : 48} color="#6b7280" />
                </div>
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '1rem', // 14px mobile, 16px desktop
                  lineHeight: '1.5'
                }}>
                  No notifications yet
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  onClick={() => handleNotificationItemClick(notification)}
                  style={{
                    padding: isMobile ? '1rem' : '1rem', // Consistent 16px padding for better mobile touch
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: notification.is_read ? 'white' : '#f0f9ff',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '5rem' : 'auto' // Increased minimum touch target height - 80px
                  }}
                  onMouseOver={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.backgroundColor = notification.is_read ? '#f9fafb' : '#e0f2fe';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f0f9ff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? '#f9fafb' : '#e0f2fe';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f0f9ff';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? '0.5rem' : '0.75rem',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {React.createElement(getNotificationIcon(notification.notification_type_id), {
                        size: isMobile ? 18 : 20,
                        color: '#6b7280'
                      })}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isMobile ? '1rem' : '0.875rem', // 16px mobile, 14px desktop - increased for better mobile readability
                        fontWeight: notification.is_read ? '400' : '600',
                        color: '#1f2937',
                        marginBottom: isMobile ? '0.5rem' : '0.25rem', // Increased margin on mobile
                        lineHeight: '1.4'
                      }}>
                        {cleanNotificationTitle(notification.title, notification.notification_type_id)}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem', // 12px mobile, 12.8px desktop
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        lineHeight: '1.5'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '0.625rem' : '0.75rem', // 10px mobile, 12px desktop
                        color: '#9ca3af',
                        lineHeight: '1.4'
                      }}>
                        {getTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div style={{
                        width: isMobile ? '0.5rem' : '0.5rem', // 8px consistent
                        height: isMobile ? '0.5rem' : '0.5rem',
                        borderRadius: '50%',
                        background: '#22c55e',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Mobile responsive */}
          {notifications.length > 0 && (
            <div style={{
              padding: isMobile ? '1rem' : '0.75rem',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              flexShrink: 0
            }}>
              {/* <button style={{
                background: 'none',
                border: 'none',
                color: '#22c55e',
                fontSize: isMobile ? '0.875rem' : '0.875rem', // 14px consistent
                fontWeight: '500',
                cursor: 'pointer',
                padding: isMobile ? '0.75rem' : '0.5rem',
                minHeight: isMobile ? '2.75rem' : 'auto' // 44px touch target
              }}>
                View all notifications
              </button> */}
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
