import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { announcementService } from '../../services'; // Not used in unified component
import { calendarReactionService } from '../../services/calendarReactionService';
import { adminHttpClient, studentHttpClient } from '../../services/api.service';
import { useCategories, useAnnouncements } from '../../hooks/useAnnouncements';
import { useNotificationTarget } from '../../hooks/useNotificationNavigation';
import { useWebSocket } from '../../hooks/useWebSocket';
import { timeService } from '../../services/timeService';
import AdminAuthContext from '../../contexts/AdminAuthContext';
import StudentAuthContext from '../../contexts/StudentAuthContext';
import AdminCommentSection from '../admin/AdminCommentSection';
import CommentSection from '../student/CommentSection';
import NotificationBell from '../admin/NotificationBell';
import StudentNotificationBell from '../student/NotificationBell';
import FacebookImageGallery from './FacebookImageGallery';
import ImageLightbox from './ImageLightbox';
import StudentProfileSettingsModal from '../student/StudentProfileSettingsModal';
import type { AnnouncementAttachment } from '../../services/announcementService';
import type { CalendarEvent } from '../../types/calendar.types';
import { getImageUrl, API_BASE_URL, ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY, LOGIN_ROUTE } from '../../config/constants';
import '../../styles/notificationHighlight.css';
import {
  Newspaper,
  Search,
  Calendar,
  MessageSquare,
  Heart,
  // Edit, // Not used in unified component
  Users,
  LayoutDashboard,
  BookOpen,
  PartyPopper,
  AlertTriangle,
  Clock,
  Trophy,
  Briefcase,
  GraduationCap,
  Flag,
  Coffee,
  Plane,
  ChevronDown,
  User,
  LogOut,
  Settings
} from 'lucide-react';





// Image Gallery Component - Now uses FacebookImageGallery for consistent responsive behavior
interface ImageGalleryProps {
  images: AnnouncementAttachment[];
  altPrefix: string;
  userRole?: 'admin' | 'student';
  onImageClick?: (index: number) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, altPrefix, userRole, onImageClick }) => {
  if (!images || images.length === 0) return null;

  // Convert AnnouncementAttachment[] to string[] for FacebookImageGallery
  const imageUrls = images.map(img => getImageUrl(img.file_path)).filter(Boolean) as string[];

  return (
    <FacebookImageGallery
      images={imageUrls}
      altPrefix={altPrefix}
      maxVisible={5}
      userRole={userRole}
      onImageClick={onImageClick}
    />
  );
};

// Props interface for the unified NewsFeed component
interface NewsFeedProps {
  userRole?: 'admin' | 'student'; // Optional prop to override role detection
}

// Main unified NewsFeed Component
const NewsFeed: React.FC<NewsFeedProps> = ({ userRole }) => {
  const navigate = useNavigate();

  // Safely get authentication contexts for both roles (must be called before any conditional logic)
  const adminAuth = useContext(AdminAuthContext);
  const studentAuth = useContext(StudentAuthContext);

  // Determine current user role and context
  const currentRole = userRole ||
    (adminAuth?.isAuthenticated ? 'admin' :
     studentAuth?.isAuthenticated ? 'student' : null);

  const currentUser = currentRole === 'admin' ? adminAuth?.user : studentAuth?.user;
  const currentLogout = currentRole === 'admin' ? adminAuth?.logout : studentAuth?.logout;

  // All hooks must be called before any early returns
  const { categories } = useCategories();

  // Use the announcements hook for proper state management with role-based service
  const {
    announcements,
    loading,
    error,
    likeAnnouncement,
    unlikeAnnouncement,
    refresh: refreshAnnouncements
  } = useAnnouncements({
    status: 'published',
    page: 1,
    limit: 50,
    sort_by: 'created_at',
    sort_order: 'DESC'
  }, currentRole === 'admin'); // true for admin service, false for student service

  // Handle notification-triggered navigation
  const { isFromNotification, scrollTarget } = useNotificationTarget();

  // WebSocket for real-time updates
  const { isConnected, on, off } = useWebSocket();

  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterGradeLevel, setFilterGradeLevel] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // UI states
  const [showComments, setShowComments] = useState<number | null>(null);
  const [showCalendarComments, setShowCalendarComments] = useState<number | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Enhanced mobile detection with multiple breakpoints and device-specific handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // More comprehensive mobile detection
      // Consider both width and device characteristics
      const isMobileWidth = width <= 768;
      const isSmallScreen = width <= 480; // For very small screens
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Set mobile state based on width and touch capability
      setIsMobile(isMobileWidth || (width <= 1024 && isTouchDevice));

      // Add CSS custom properties for responsive scaling
      document.documentElement.style.setProperty('--viewport-width', `${width}px`);
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
      document.documentElement.style.setProperty('--is-small-screen', isSmallScreen ? '1' : '0');
    };

    // Ensure proper viewport meta tag handling
    const ensureViewportMeta = () => {
      let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      // Set optimal viewport settings for mobile responsiveness
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
    };

    ensureViewportMeta();
    handleResize(); // Check initial size

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Initialize server time to prevent client-side time manipulation
  useEffect(() => {
    const initializeServerTime = async () => {
      try {
        setServerTimeLoading(true);
        const serverTimeData = await timeService.getCurrentTime();
        setServerTime(new Date(serverTimeData.timestamp));
        console.log('🕐 Server time initialized:', serverTimeData.formatted);
      } catch (error) {
        console.error('❌ Failed to initialize server time:', error);
        // Fallback to client time with warning (not recommended for production)
        console.warn('⚠️ Using client time as fallback - this may allow time manipulation');
        setServerTime(new Date());
      } finally {
        setServerTimeLoading(false);
      }
    };

    initializeServerTime();

    // Refresh server time every 5 minutes to keep it current
    const interval = setInterval(async () => {
      try {
        const serverTimeData = await timeService.getCurrentTime(false); // Don't use cache
        setServerTime(new Date(serverTimeData.timestamp));
      } catch (error) {
        console.error('❌ Failed to refresh server time:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxInitialIndex, setLightboxInitialIndex] = useState(0);

  // Data states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | undefined>();

  // Server time state to prevent client-side time manipulation
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [serverTimeLoading, setServerTimeLoading] = useState(true);
  // Note: recentStudents and studentLoading state can be added later if needed

  // Fetch calendar events function
  const fetchCalendarEvents = useCallback(async () => {
    try {
      setCalendarLoading(true);
      setCalendarError(undefined);

      const authToken = currentRole === 'admin'
        ? localStorage.getItem(ADMIN_AUTH_TOKEN_KEY)
        : localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

      const response = await fetch(`${API_BASE_URL}/api/calendar?limit=50&sort_by=event_date&sort_order=ASC`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.data) {
        const eventsData = data.data.events || data.data || [];



        // Fetch images for each event
        const eventsWithImages = await Promise.all(
          eventsData.map(async (event: any) => {
            try {
              const imageResponse = await fetch(`${API_BASE_URL}/api/calendar/${event.calendar_id}/images`, {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
                }
              });
              const imageData = await imageResponse.json();

              if (imageData.success && imageData.data) {
                event.images = imageData.data.attachments || [];
              } else {
                event.images = [];
              }
            } catch (imgErr) {
              console.warn(`Failed to fetch images for event ${event.calendar_id}:`, imgErr);
              event.images = [];
            }
            return event;
          })
        );

        setCalendarEvents(eventsWithImages);
      } else {
        setCalendarError('Failed to load calendar events');
      }
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setCalendarError(err.message || 'Failed to load calendar events');
    } finally {
      setCalendarLoading(false);
    }
  }, [currentRole]);



  // Real-time WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return;

    console.log('🔌 Setting up WebSocket listeners for NewsFeed');

    // Listen for announcement reaction updates
    const handleAnnouncementReaction = (data: any) => {
      console.log('📢 Real-time announcement reaction update:', data);

      // Update announcement reactions in real-time
      refreshAnnouncements();
    };

    // Listen for calendar reaction updates
    const handleCalendarReaction = (data: any) => {
      console.log('📅 Real-time calendar reaction update:', data);

      // Update calendar event reactions in real-time
      setCalendarEvents(prevEvents =>
        prevEvents.map(event => {
          if (event.calendar_id === data.calendarId) {
            // Determine if this is the current user's reaction
            const isCurrentUserReaction =
              (currentRole === 'admin' && data.userType === 'admin' && data.userId === currentUser?.id) ||
              (currentRole === 'student' && data.userType === 'student' && data.userId === currentUser?.id);

            if (isCurrentUserReaction) {
              // Update user's own reaction state
              const newReactionState = data.action === 'added';
              const newReactionCount = data.action === 'added'
                ? (event.reaction_count || 0) + 1
                : Math.max(0, (event.reaction_count || 0) - 1);

              return {
                ...event,
                user_has_reacted: newReactionState,
                reaction_count: newReactionCount
              };
            } else {
              // Update reaction count for other users' reactions
              const countChange = data.action === 'added' ? 1 : -1;
              return {
                ...event,
                reaction_count: Math.max(0, (event.reaction_count || 0) + countChange)
              };
            }
          }
          return event;
        })
      );
    };

    // Listen for new announcements
    const handleNewAnnouncement = (data: any) => {
      console.log('📢 New announcement created:', data);
      refreshAnnouncements();
    };

    // Listen for announcement updates
    const handleAnnouncementUpdate = (data: any) => {
      console.log('📢 Announcement updated:', data);
      refreshAnnouncements();
    };

    // Listen for announcement deletions
    const handleAnnouncementDelete = (data: any) => {
      console.log('📢 Announcement deleted:', data);
      refreshAnnouncements();
    };

    // Register event listeners
    on('announcement-reaction-updated', handleAnnouncementReaction);
    on('calendar-reaction-updated', handleCalendarReaction);
    on('announcement-created', handleNewAnnouncement);
    on('announcement-updated', handleAnnouncementUpdate);
    on('announcement-deleted', handleAnnouncementDelete);

    // Cleanup listeners on unmount or when connection changes
    return () => {
      console.log('🔌 Cleaning up WebSocket listeners for NewsFeed');
      off('announcement-reaction-updated', handleAnnouncementReaction);
      off('calendar-reaction-updated', handleCalendarReaction);
      off('announcement-created', handleNewAnnouncement);
      off('announcement-updated', handleAnnouncementUpdate);
      off('announcement-deleted', handleAnnouncementDelete);
    };
  }, [isConnected, on, off, refreshAnnouncements, currentRole, currentUser?.id]);

  // Initial data fetch
  useEffect(() => {
    fetchCalendarEvents();
    // Note: fetchRecentStudents functionality can be added later if needed for admin dashboard
  }, [currentRole, fetchCalendarEvents]); // Re-fetch when role changes

  // Re-trigger filtering when server time becomes available
  useEffect(() => {
    if (serverTime && !serverTimeLoading) {
      console.log('🕐 Server time loaded, calendar events will be re-filtered automatically');
      // The filtering logic will automatically re-run because it depends on serverTime state
      // No need to manually trigger re-filtering since the component will re-render
    }
  }, [serverTime, serverTimeLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown="user-dropdown"]')) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  // Remove duplicate responsive behavior detection - already handled above



  // Early return if no valid role is detected (after all hooks)
  if (!currentRole) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fdf8 0%, #fffef7 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Authentication Required</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Please log in to access the newsfeed.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Open lightbox function for announcements
  const openLightbox = (images: AnnouncementAttachment[], initialIndex: number) => {
    const imageUrls = images.map(img => getImageUrl(img.file_path)).filter(Boolean) as string[];
    setLightboxImages(imageUrls);
    setLightboxInitialIndex(initialIndex);
    setLightboxOpen(true);
  };

  // Open lightbox function for image URLs (calendar events)
  const openLightboxWithUrls = (imageUrls: string[], initialIndex: number) => {
    setLightboxImages(imageUrls);
    setLightboxInitialIndex(initialIndex);
    setLightboxOpen(true);
  };

  // Category styling function
  const getCategoryStyle = (categoryName: string) => {
    const styles = {
      'ACADEMIC': {
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        icon: BookOpen
      },
      'GENERAL': {
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        icon: Users
      },
      'EVENTS': {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        icon: PartyPopper
      },
      'EMERGENCY': {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        icon: AlertTriangle
      },
      'SPORTS': {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        icon: Trophy
      },
      'DEADLINES': {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        icon: Clock
      }
    };

    return styles[categoryName as keyof typeof styles] || styles['GENERAL'];
  };

  // Holiday type styling function
  const getHolidayTypeStyle = (holidayTypeName: string) => {
    const styles = {
      'National Holiday': {
        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        icon: Flag
      },
      'School Event': {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        icon: GraduationCap
      },
      'Academic Break': {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        icon: Coffee
      },
      'Sports Event': {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        icon: Trophy
      },
      'Field Trip': {
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        icon: Plane
      },
      'Meeting': {
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        icon: Briefcase
      }
    };

    return styles[holidayTypeName as keyof typeof styles] || styles['School Event'];
  };

  // Note: Duplicate useEffect and function removed - already defined above

  // Handle like/unlike functionality (role-aware) with optimistic updates
  const handleLikeToggle = async (announcement: any) => {
    const originalReaction = announcement.user_reaction;
    const originalCount = announcement.reaction_count || 0;

    try {
      console.log(`[DEBUG] ${currentRole} toggling reaction for announcement:`, announcement.announcement_id);
      console.log('[DEBUG] Current user_reaction:', announcement.user_reaction);
      console.log(`[DEBUG] ${currentRole} user context:`, { id: currentUser?.id, role: currentRole });

      // Optimistic update - update UI immediately
      const newReactionState = !announcement.user_reaction;
      const newReactionCount = newReactionState
        ? originalCount + 1
        : Math.max(0, originalCount - 1);

      console.log(`[OPTIMISTIC] ${currentRole} updating UI optimistically:`, {
        announcementId: announcement.announcement_id,
        newReactionState,
        newReactionCount
      });

      if (announcement.user_reaction) {
        // Unlike the announcement
        console.log(`[DEBUG] ${currentRole} removing reaction...`);
        await unlikeAnnouncement(announcement.announcement_id);
      } else {
        // Like the announcement
        console.log(`[DEBUG] ${currentRole} adding reaction...`);
        await likeAnnouncement(announcement.announcement_id, 1);
      }

      console.log(`[SUCCESS] ${currentRole} reaction toggled successfully`);
    } catch (error) {
      console.error(`[ERROR] ${currentRole} error toggling like:`, error);

      // Rollback optimistic update on error
      console.log(`[ROLLBACK] ${currentRole} rolling back optimistic update`);
      // The useAnnouncements hook should handle the rollback automatically
      // but we could also manually refresh if needed
      refreshAnnouncements();
    }
  };

  // Role-aware calendar reaction function
  const toggleCalendarReaction = async (eventId: number, currentlyLiked: boolean) => {
    const client = currentRole === 'admin' ? adminHttpClient : studentHttpClient;
    const endpoint = `/api/calendar/${eventId}/like`;

    console.log(`[DEBUG] ${currentRole} making direct API call to:`, endpoint);
    console.log(`[DEBUG] Using ${currentRole} HTTP client`);

    if (currentlyLiked) {
      // Unlike the event
      return await client.delete(endpoint);
    } else {
      // Like the event
      return await client.post(endpoint, {});
    }
  };

  // Handle calendar event like/unlike functionality with optimistic updates
  const handleCalendarLikeToggle = async (event: any) => {
    const originalReactionState = event.user_has_reacted || false;
    const originalCount = event.reaction_count || 0;

    try {
      console.log(`[DEBUG] ${currentRole} toggling reaction for calendar event:`, event.calendar_id);
      console.log('[DEBUG] Current user_has_reacted:', event.user_has_reacted);
      console.log(`[DEBUG] ${currentRole} user context:`, { id: currentUser?.id, role: currentRole });

      // Optimistic update - update UI immediately
      const newReactionState = !originalReactionState;
      const newReactionCount = newReactionState
        ? originalCount + 1
        : Math.max(0, originalCount - 1);

      console.log(`[OPTIMISTIC] ${currentRole} updating calendar UI optimistically:`, {
        eventId: event.calendar_id,
        oldReactionState: originalReactionState,
        newReactionState,
        oldCount: originalCount,
        newCount: newReactionCount
      });

      // Apply optimistic update immediately
      setCalendarEvents(prevEvents =>
        prevEvents.map(e =>
          e.calendar_id === event.calendar_id
            ? {
                ...e,
                user_has_reacted: newReactionState,
                reaction_count: newReactionCount
              }
            : e
        )
      );

      // Make API call
      const response = await toggleCalendarReaction(event.calendar_id, originalReactionState);

      if (response.success) {
        console.log(`[SUCCESS] ${currentRole} calendar event reaction toggled successfully`);
        // The optimistic update should already be correct, but we could sync with server response if needed
      } else {
        throw new Error(response.message || 'Failed to toggle calendar reaction');
      }
    } catch (error) {
      console.error(`[ERROR] ${currentRole} error toggling calendar like:`, error);

      // Rollback optimistic update on error
      console.log(`[ROLLBACK] ${currentRole} rolling back calendar optimistic update`);
      setCalendarEvents(prevEvents =>
        prevEvents.map(e =>
          e.calendar_id === event.calendar_id
            ? {
                ...e,
                user_has_reacted: originalReactionState,
                reaction_count: originalCount
              }
            : e
        )
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      if (currentLogout) {
        await currentLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Force redirect even if logout fails
      window.location.href = LOGIN_ROUTE;
    }
  };

  // Note: Duplicate useEffect for dropdown removed - already defined above



  // Base filtering function for announcements
  const getBaseFilteredAnnouncements = (announcements: any[]) => {
    return announcements.filter(announcement => {
      const matchesSearch = !searchTerm ||
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !filterCategory ||
        announcement.category_id?.toString() === filterCategory;

      const matchesGradeLevel = !filterGradeLevel ||
        announcement.grade_level?.toString() === filterGradeLevel;

      // Check visibility date/time filtering
      const now = new Date();
      const isVisibleByStartDate = !announcement.visibility_start_at ||
        new Date(announcement.visibility_start_at) <= now;
      const isVisibleByEndDate = !announcement.visibility_end_at ||
        new Date(announcement.visibility_end_at) >= now;

      // Alert announcements are always visible regardless of visibility dates
      const isCurrentlyVisible = Boolean(announcement.is_alert) || (isVisibleByStartDate && isVisibleByEndDate);



      // Log visibility filtering for debugging
      if (!isCurrentlyVisible) {
        console.log('🚫 Announcement filtered out by visibility:', {
          title: announcement.title,
          now: now.toISOString(),
          visibility_start_at: announcement.visibility_start_at,
          visibility_end_at: announcement.visibility_end_at,
          isVisibleByStartDate,
          isVisibleByEndDate,
          isCurrentlyVisible
        });
      }

      return matchesSearch && matchesCategory && matchesGradeLevel && isCurrentlyVisible;
    });
  };

  // Filter alert announcements (is_alert: true)
  const filteredAlertAnnouncements = getBaseFilteredAnnouncements(announcements).filter(announcement =>
    Boolean(announcement.is_alert)
  );

  // Filter regular announcements (is_alert: false or undefined)
  const filteredRegularAnnouncements = getBaseFilteredAnnouncements(announcements).filter(announcement =>
    !Boolean(announcement.is_alert)
  );

  // Filter calendar events with date-based filtering and category filtering


  const filteredCalendarEvents = calendarEvents.filter(event => {
    const matchesSearch = !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Add category filtering for calendar events (same logic as announcements)
    const matchesCategory = !filterCategory ||
      event.category_id?.toString() === filterCategory;

    // Show events that are currently active (between start and end date)
    // Use local dates to avoid timezone issues (same logic as StudentNewsfeed)
    const today = new Date();
    const todayDateString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    const eventStartDate = new Date(event.event_date);
    const eventStartDateString = eventStartDate.getFullYear() + '-' +
      String(eventStartDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(eventStartDate.getDate()).padStart(2, '0');

    // If event has an end date, use it; otherwise, show for the event date only
    const eventEndDateString = event.end_date ? (() => {
      const endDate = new Date(event.end_date);
      return endDate.getFullYear() + '-' +
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(endDate.getDate()).padStart(2, '0');
    })() : eventStartDateString;

    // Event is active if today is between start and end date (inclusive)
    const isEventActive = todayDateString >= eventStartDateString && todayDateString <= eventEndDateString;

    // For admins, show both published and unpublished events (but only currently active events)
    const isActive = Boolean((event as any).is_active);

    return matchesSearch && matchesCategory && isEventActive && isActive;
  });

  // Helper function to create sorted posts with proper date handling
  const createSortedPosts = (items: any[], type: 'event' | 'announcement') => {
    return items.map(item => ({
      ...item,
      type,
      // Use end_date for events, visibility_end_at for announcements, with proper fallbacks
      sortDate: type === 'event'
        ? new Date(item.end_date || item.event_date)
        : new Date(item.visibility_end_at || item.visibility_start_at || item.created_at),
      displayDate: type === 'event'
        ? item.event_date
        : (item.visibility_start_at || item.created_at)
    })).sort((a, b) => {
      // Sort by end date ascending (posts ending sooner appear at the top)
      const dateA = a.sortDate.getTime();
      const dateB = b.sortDate.getTime();

      // Handle invalid dates by putting them at the end
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return dateA - dateB;
    });
  };

  // Create alert section (calendar events with is_alert: true + alert announcements)
  const alertCalendarEvents = filteredCalendarEvents.filter(event => Boolean(event.is_alert));
  const alertCalendarPosts = createSortedPosts(alertCalendarEvents, 'event');
  const alertAnnouncementPosts = createSortedPosts(filteredAlertAnnouncements, 'announcement');

  // Combine and sort alert posts by end date
  const alertPosts = [...alertCalendarPosts, ...alertAnnouncementPosts].sort((a, b) => {
    const dateA = a.sortDate.getTime();
    const dateB = b.sortDate.getTime();

    // Handle invalid dates
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;

    return dateA - dateB;
  });

  // Create regular posts section (calendar events with is_alert: false + regular announcements)
  const regularCalendarEvents = filteredCalendarEvents.filter(event => !Boolean(event.is_alert));
  const regularCalendarPosts = createSortedPosts(regularCalendarEvents, 'event');
  const regularAnnouncementPosts = createSortedPosts(filteredRegularAnnouncements, 'announcement');

  // Combine and sort regular posts by end date
  const regularPosts = [...regularCalendarPosts, ...regularAnnouncementPosts].sort((a, b) => {
    const dateA = a.sortDate.getTime();
    const dateB = b.sortDate.getTime();

    // Handle invalid dates
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;

    return dateA - dateB;
  });

  // Debug logging for content separation
  console.log('📊 CONTENT SEPARATION DEBUG:', {
    totalAnnouncements: announcements.length,
    filteredAlertAnnouncements: filteredAlertAnnouncements.length,
    filteredRegularAnnouncements: filteredRegularAnnouncements.length,
    totalCalendarEvents: calendarEvents.length,
    filteredCalendarEvents: filteredCalendarEvents.length,
    alertCalendarEvents: alertCalendarEvents.length,
    regularCalendarEvents: regularCalendarEvents.length,
    totalAlertPosts: alertPosts.length,
    totalRegularPosts: regularPosts.length,
    serverTime: serverTime ? serverTime.toISOString() : 'NOT_LOADED',
    serverTimeLoading
  });

  console.log('🚨 Alert posts order (sorted by end date - ending sooner first):', alertPosts.map(item => ({
    title: item.title,
    type: item.type,
    displayDate: item.displayDate,
    endDate: item.type === 'event'
      ? (item.end_date || item.event_date)
      : (item.visibility_end_at || item.visibility_start_at || item.created_at),
    sortDate: item.sortDate.toISOString(),
    is_alert: item.is_alert
  })));

  console.log('📅 Regular posts order (sorted by end date - ending sooner first):', regularPosts.map(item => ({
    title: item.title,
    type: item.type,
    displayDate: item.displayDate,
    endDate: item.type === 'event'
      ? (item.end_date || item.event_date)
      : (item.visibility_end_at || item.visibility_start_at || item.created_at),
    sortDate: item.sortDate.toISOString(),
    is_alert: item.is_alert
  })));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Enhanced Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Enhanced Modern Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            padding: isMobile ? '0 0.75rem' : '0 2rem', // Reduced mobile padding for more space
            height: isMobile ? '3.5rem' : '4.5rem', // 56px mobile, 72px desktop - reduced for better mobile fit
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap', // Always nowrap to prevent layout issues
            minWidth: 0, // Allow shrinking
            width: '100%'
          }}>
            {/* Left Section: Logo + Page Title */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1.5rem',
              minWidth: isMobile ? 'auto' : '18.75rem', // 300px on desktop
              flex: isMobile ? '1' : 'none'
            }}>
              <img
                src="/logo/vcba1.png"
                alt="VCBA Logo"
                style={{
                  width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
                  height: isMobile ? '2.5rem' : '3rem',
                  objectFit: 'contain'
                }}
              />
              <div>
                <h1 style={{
                  margin: 0,
                  fontSize: isMobile ? '1rem' : '1.25rem', // 16px mobile, 20px desktop
                  fontWeight: '600',
                  color: '#111827',
                  lineHeight: '1.2'
                }}>
                  VCBA E-Bulletin Board
                </h1>
                {!isMobile && (
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem', // 14px
                    color: '#6b7280',
                    lineHeight: '1.2'
                  }}>
                   {/* ill comment this for now and uncomment it soon */}
                    {/* {currentRole === 'admin' ? 'Admin Newsfeed' : 'Student Newsfeed'} */}
                  </p>
                )}
              </div>
            </div>

            {/* Center Section: Search - Mobile responsive */}
            {!isMobile && (
              <div style={{
                flex: 1,
                maxWidth: '31.25rem', // 500px
                margin: '0 2rem'
              }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={20}
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search post"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: '2.75rem', // 44px - minimum touch target
                      padding: '0 1rem 0 3rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem', // 12px
                      background: '#f9fafb',
                      color: '#374151',
                      fontSize: '0.875rem', // 14px
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#22c55e';
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Right Section: Navigation + Filters - Mobile responsive */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.25rem' : '1rem', // Reduced gap on mobile for more space
              minWidth: isMobile ? 'auto' : '25rem', // 400px on desktop
              justifyContent: 'flex-end',
              flex: isMobile ? '0 0 auto' : 'none',
              flexShrink: 0 // Prevent shrinking of notification bell and user menu
            }}>

              {/* Filters Group - Hidden on mobile, shown in separate row */}
              {!isMobile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem', // 12px
                  border: '1px solid #e5e7eb'
                }}>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      borderRadius: '0.5rem', // 8px
                      background: 'white',
                      color: '#374151',
                      fontSize: '0.875rem', // 14px
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '6.875rem' // 110px
                    }}
                  >
                    <option value="">All Categories</option>
                    {categories
                      .filter(category =>
                        // Hide holiday categories from dropdown
                        !['Philippine Holidays', 'International Holidays', 'Religious Holidays'].includes(category.name)
                      )
                      .map(category => (
                        <option key={category.category_id} value={category.category_id.toString()}>
                          {category.name}
                        </option>
                      ))
                    }
                  </select>

                  <select
                    value={filterGradeLevel}
                    onChange={(e) => setFilterGradeLevel(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      borderRadius: '0.5rem', // 8px
                      background: 'white',
                      color: '#374151',
                      fontSize: '0.875rem', // 14px
                      outline: 'none',
                      cursor: 'pointer',
                      minWidth: '6.25rem' // 100px
                    }}
                  >
                    <option value="">All Grades</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>

                  {(searchTerm || filterCategory || filterGradeLevel) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterCategory('');
                        setFilterGradeLevel('');
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        borderRadius: '0.5rem', // 8px
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.875rem', // 14px
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '2.75rem' // 44px minimum touch target
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Right Side Actions - Mobile responsive */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.25rem' : '1rem', // Reduced gap for mobile
                flexShrink: 0 // Prevent shrinking
              }}>
                {/* Notification Bell - Role-aware with mobile optimization */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: isMobile ? '2.5rem' : 'auto', // Ensure minimum touch target
                  minHeight: isMobile ? '2.5rem' : 'auto'
                }}>
                  {currentRole === 'admin' ? <NotificationBell /> : <StudentNotificationBell />}
                </div>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }} data-dropdown="user-dropdown">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '0.25rem' : '0.5rem',
                      padding: isMobile ? '0.5rem' : '0.75rem 1rem',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.75rem', // 12px
                      color: '#374151',
                      fontSize: isMobile ? '0.75rem' : '0.875rem', // 12px mobile, 14px desktop
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      minHeight: '2.75rem' // 44px minimum touch target
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#22c55e';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Profile Picture */}
                    {currentUser?.profilePicture ? (
                      <img
                        src={getImageUrl(currentUser.profilePicture) || ''}
                        alt={`${currentUser.firstName} ${currentUser.lastName}`}
                        style={{
                          width: isMobile ? '1.5rem' : '1.5rem', // 24px
                          height: isMobile ? '1.5rem' : '1.5rem',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #e5e7eb'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const userIcon = parent.querySelector('.user-icon');
                            if (userIcon) {
                              (userIcon as HTMLElement).style.display = 'block';
                            }
                          }
                        }}
                      />
                    ) : null}
                    <User
                      size={isMobile ? 14 : 16}
                      className="user-icon"
                      style={{
                        display: currentUser?.profilePicture ? 'none' : 'block'
                      }}
                    />
                    {!isMobile && currentUser?.firstName && currentUser?.lastName && currentUser?.grade_level ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.875rem' }}>{`${currentUser.firstName} ${currentUser.lastName}`}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Grade {currentUser.grade_level}</span>
                      </div>
                    ) : !isMobile ? (
                      <span style={{ fontSize: '0.875rem' }}>{currentUser?.firstName || (currentRole === 'admin' ? 'Admin' : 'Student')}</span>
                    ) : null}
                    <ChevronDown size={isMobile ? 12 : 14} style={{
                      transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                      minWidth: '200px',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f3f4f6',
                        background: '#f9fafb'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.5rem'
                        }}>
                          {/* Profile Picture */}
                          {currentUser?.profilePicture ? (
                            <img
                              src={getImageUrl(currentUser.profilePicture) || ''}
                              alt={`${currentUser.firstName} ${currentUser.lastName}`}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #e5e7eb',
                                flexShrink: 0
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div style="
                                      width: 40px;
                                      height: 40px;
                                      border-radius: 50%;
                                      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      color: white;
                                      font-weight: 600;
                                      font-size: 1rem;
                                      flex-shrink: 0;
                                    ">
                                      ${currentUser?.firstName?.charAt(0) || ''}${currentUser?.lastName?.charAt(0) || ''}
                                    </div>
                                  `;
                                }
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '1rem',
                              flexShrink: 0
                            }}>
                              {currentUser?.firstName?.charAt(0) || ''}{currentUser?.lastName?.charAt(0) || ''}
                            </div>
                          )}

                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#111827'
                            }}>
                              {currentUser?.firstName} {currentUser?.lastName}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              Grade {currentUser?.grade_level}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '0.5rem 0' }}>
                        {/* Role-based menu items */}
                        {currentRole === 'admin' ? (
                          // Admin: Show Dashboard button
                          //Redirect the professor to the post management page
                          <button
                            onClick={() => {
                              navigate('/admin/posts');
                              setShowUserDropdown(false);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              background: 'transparent',
                              border: 'none',
                              color: '#374151',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <LayoutDashboard size={16} />
                            Dashboard
                          </button>
                        ) : (
                          // Student: Show Profile Settings button
                          <button
                            onClick={() => {
                              setShowProfileSettings(true);
                              setShowUserDropdown(false);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              background: 'transparent',
                              border: 'none',
                              color: '#374151',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Settings size={16} />
                            Profile Settings
                          </button>
                        )}

                        <button
                          onClick={() => {
                            handleLogout();
                            setShowUserDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search and Filters - Only shown on mobile */}
        {isMobile && (
          <div style={{
            padding: '0.75rem', // Reduced padding for more space
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            // Ensure proper mobile layout
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {/* Mobile Search */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  zIndex: 1
                }}
              />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '2.75rem', // 44px - good touch target, slightly reduced
                  padding: '0 0.75rem 0 2.25rem', // Reduced padding
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem', // 8px - slightly reduced
                  background: '#f9fafb',
                  color: '#374151',
                  fontSize: '1rem', // 16px - prevents zoom on iOS
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Mobile Filters */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '7rem', // 112px - reduced for better fit
                  padding: '0.75rem 0.5rem', // Reduced padding
                  border: '1px solid #d1d5db', // Simplified border
                  borderRadius: '0.5rem', // 8px - reduced
                  background: 'white',
                  color: '#1f2937',
                  fontSize: '0.875rem', // 14px
                  fontWeight: '500',
                  outline: 'none',
                  cursor: 'pointer',
                  minHeight: '2.75rem', // 44px touch target - reduced
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Categories</option>
                {categories
                  .filter(category =>
                    !['Philippine Holidays', 'International Holidays', 'Religious Holidays'].includes(category.name)
                  )
                  .map(category => (
                    <option key={category.category_id} value={category.category_id.toString()}>
                      {category.name}
                    </option>
                  ))
                }
              </select>

              <select
                value={filterGradeLevel}
                onChange={(e) => setFilterGradeLevel(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '6rem', // 96px - reduced for better fit
                  padding: '0.75rem 0.5rem', // Reduced padding
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem', // 8px
                  background: 'white',
                  color: '#374151',
                  fontSize: '0.875rem', // 14px
                  outline: 'none',
                  cursor: 'pointer',
                  minHeight: '2.75rem', // 44px touch target - reduced
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Grades</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>

              {(searchTerm || filterCategory || filterGradeLevel) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterGradeLevel('');
                  }}
                  style={{
                    padding: '0.75rem 0.875rem', // Reduced padding
                    border: 'none',
                    borderRadius: '0.5rem', // 8px
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.875rem', // 14px
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: '2.75rem', // 44px touch target - reduced
                    whiteSpace: 'nowrap',
                    flexShrink: 0, // Prevent shrinking
                    boxSizing: 'border-box'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.background = '#dc2626';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Main Content Layout with improved mobile responsiveness */}
        <div style={{
          padding: isMobile ? '0.75rem' : '2.5rem',
          paddingTop: isMobile ? '0.5rem' : '1.5rem',
          maxWidth: '80rem', // 1280px - increased for better content width
          margin: '0 auto',
          width: '100%',
          // Ensure content doesn't get cut off on very small screens
          minWidth: 0, // Allow shrinking
          overflowX: 'hidden' // Prevent horizontal scroll
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.25rem' // 16px mobile, 20px desktop - increased spacing
          }}>
          {/* Loading State */}
          {(loading || calendarLoading) && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: isMobile ? '20rem' : '25rem' // 320px mobile, 400px desktop
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
                  height: isMobile ? '2.5rem' : '3rem',
                  border: '4px solid rgba(34, 197, 94, 0.2)',
                  borderTop: '4px solid #22c55e',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{
                  color: '#6b7280',
                  fontSize: isMobile ? '0.875rem' : '1rem', // 14px mobile, 16px desktop
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  Loading content...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {(error || calendarError) && !loading && !calendarLoading && (
            <div style={{
              padding: '2rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <MessageSquare size={24} color="#ef4444" />
              </div>
              <h3 style={{
                color: '#ef4444',
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                Error Loading Content
              </h3>
              <p style={{
                color: '#6b7280',
                margin: '0 0 1.5rem 0',
                fontSize: '1rem'
              }}>
                {error || calendarError}
              </p>
              <button
                onClick={() => {
                  refreshAnnouncements();
                  fetchCalendarEvents();
                }}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !calendarLoading && !error && !calendarError &&
           alertPosts.length === 0 && regularPosts.length === 0 && (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '5rem',
                height: '5rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem'
              }}>
                <Newspaper size={32} color="white" />
              </div>
              <h3 style={{
                color: '#374151',
                margin: '0 0 1rem 0',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                No Content Available
              </h3>
              <p style={{
                color: '#6b7280',
                margin: '0 0 2rem 0',
                fontSize: '1rem',
                lineHeight: '1.6',
                maxWidth: '500px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                {searchTerm || filterCategory || filterGradeLevel
                  ? 'No content matches your current filters. Try adjusting your search criteria.'
                  : 'There are no published announcements or events at the moment. Check back later for updates.'
                }
              </p>
              {(searchTerm || filterCategory || filterGradeLevel) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterGradeLevel('');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Recent Students Section (Admin Only) - Commented out for now */}
          {/* Future feature: Recent student registrations for admin dashboard */}

          {/* Content Feed */}
          {!loading && !calendarLoading && (alertPosts.length > 0 || regularPosts.length > 0) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px' // Gap between sections as specified
            }}>
              {/* Alert Posts Section (High Priority - Calendar Events & Announcements with is_alert: true) */}
              {alertPosts.length > 0 && (
                <section aria-label="Alert announcements and urgent events" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  {/* Alert Section Header */}
                  {/* <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: isMobile ? '1rem' : '1.5rem',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    borderRadius: '1rem',
                    border: '2px solid rgba(239, 68, 68, 0.2)',
                    margin: isMobile ? '0 0.5rem' : '0'
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertTriangle size={20} color="white" />
                    </div>
                    <div>
                      <h2 style={{
                        margin: 0,
                        fontSize: isMobile ? '1.125rem' : '1.25rem',
                        fontWeight: '700',
                        color: '#dc2626',
                        lineHeight: '1.4'
                      }}>
                        Important Alerts
                      </h2>
                      <p style={{
                        margin: 0,
                        fontSize: isMobile ? '0.875rem' : '0.95rem',
                        color: '#7f1d1d',
                        lineHeight: '1.5'
                      }}>
                        {alertPosts.length} urgent {alertPosts.length === 1 ? 'notification' : 'notifications'} requiring immediate attention
                      </p>
                    </div>
                  </div> */}

                  {alertPosts.map(item => {
                if (item.type === 'event') {
                  const event = item as any; // Type cast to access calendar event properties
                  return (
                    <div
                      key={`event-${event.calendar_id}`}
                      className={Boolean(event.is_alert) ? 'news-alert' : ''}
                      style={{
                        background: Boolean(event.is_alert)
                          ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                        borderRadius: isMobile ? '0.75rem' : '1.25rem', // 12px mobile, 20px desktop
                        padding: isMobile ? '1rem' : '1.75rem', // 16px mobile, 28px desktop
                        border: Boolean(event.is_alert)
                          ? '2px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(226, 232, 240, 0.6)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: Boolean(event.is_alert)
                          ? '0 8px 32px rgba(239, 68, 68, 0.12), 0 2px 8px rgba(239, 68, 68, 0.08)'
                          : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        margin: isMobile ? '0' : '0', // Remove side margins on mobile for full width
                        overflow: 'hidden',
                        // Ensure proper mobile scaling
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                      role={Boolean(event.is_alert) ? "status" : undefined}
                      aria-live={Boolean(event.is_alert) ? "polite" : undefined}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                        e.currentTarget.style.boxShadow = Boolean(event.is_alert)
                          ? '0 16px 48px rgba(239, 68, 68, 0.18), 0 4px 16px rgba(239, 68, 68, 0.12)'
                          : '0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = Boolean(event.is_alert)
                          ? '0 8px 32px rgba(239, 68, 68, 0.12), 0 2px 8px rgba(239, 68, 68, 0.08)'
                          : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)';
                      }}
                    >
                      {/* Alert Badge - Top Right Corner */}
                      {Boolean(event.is_alert) && (
                        <span
                          className="badge alert"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                            zIndex: 1
                          }}
                        >
                          <AlertTriangle size={12} color="white" />
                          ALERT
                        </span>
                      )}

                      {/* Event Header - Mobile responsive */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: isMobile ? '0.75rem' : '1rem',
                        marginBottom: isMobile ? '0.75rem' : '1rem'
                      }}>
                          <img
                            src="/logo/vcba1.png"
                            alt="VCBA Logo"
                            style={{
                              width: isMobile ? '3rem' : '4rem', // 48px mobile, 64px desktop
                              height: isMobile ? '3rem' : '4rem',
                              objectFit: 'contain',
                              flexShrink: 0
                            }}
                          />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isMobile ? '0.5rem' : '0.75rem',
                              flexWrap: isMobile ? 'wrap' : 'nowrap'
                            }}>
                              <span style={{
                                fontWeight: 'bold',
                                fontSize: isMobile ? '0.875rem' : '1rem', // 14px mobile, 16px desktop
                                lineHeight: '1.5'
                              }}>
                                VILLAMOR COLLEGE OF BUSINESS AND ARTS
                              </span>
                              {(() => {
                                const holidayTypeName = event.category_name || 'School Event';
                                const holidayStyle = getHolidayTypeStyle(holidayTypeName);
                                const IconComponent = holidayStyle.icon;

                                return (
                                  <span style={{
                                    background: holidayStyle.background,
                                    color: 'white',
                                    fontSize: isMobile ? '0.625rem' : '0.75rem', // 10px mobile, 12px desktop
                                    fontWeight: '600',
                                    padding: isMobile ? '0.125rem 0.5rem' : '0.25rem 0.75rem',
                                    borderRadius: '1.25rem', // 20px
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    <IconComponent size={isMobile ? 10 : 12} color="white" />
                                    {isMobile ? holidayTypeName.split(' ')[0] : holidayTypeName}
                                  </span>
                                );
                              })()}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#6b7280',
                              fontSize: isMobile ? '0.75rem' : '0.875rem', // 12px mobile, 14px desktop
                              lineHeight: '1.5'
                            }}>
                              <Calendar size={isMobile ? 12 : 14} />
                                {event.end_date && event.end_date !== event.event_date
                                  ? `${new Date(event.event_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                                  : new Date(event.event_date).toLocaleDateString()
                                }
                            </div>
                          </div>

                        </div>
                      </div>

                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: isMobile ? '1.125rem' : '1.25rem', // 18px mobile, 20px desktop
                        fontWeight: '700',
                        color: '#1f2937',
                        lineHeight: '1.4'
                      }}>
                        {event.title}
                      </h3>

                      {/* Event Images */}
                      {(() => {
                        // Get event images if they exist
                        const eventImageUrls: string[] = [];

                        if ((event as any).images && (event as any).images.length > 0) {
                          (event as any).images.forEach((img: any) => {
                            if (img.file_path) {
                              // Convert file_path to full URL
                              const imageUrl = getImageUrl(img.file_path);
                              if (imageUrl) {
                                eventImageUrls.push(imageUrl);
                              }
                            }
                          });
                        }

                        return eventImageUrls.length > 0 ? (
                          <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
                            <FacebookImageGallery
                              images={eventImageUrls.filter(Boolean) as string[]}
                              altPrefix={event.title}
                              maxVisible={5}
                              userRole={currentRole}
                              onImageClick={(index) => {
                                const filteredImages = eventImageUrls.filter(Boolean) as string[];
                                openLightboxWithUrls(filteredImages, index);
                              }}
                            />
                          </div>
                        ) : null;
                      })()}

                      {/* Event Content */}
                      {event.description && (
                        <div style={{
                          color: '#4b5563',
                          fontSize: isMobile ? '0.875rem' : '0.95rem', // 14px mobile, 15.2px desktop
                          lineHeight: '1.6',
                          marginBottom: isMobile ? '0.75rem' : '1rem'
                        }}>
                          {event.description}
                        </div>
                      )}

                      {/* Calendar Event Interaction Section */}
                      <div style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        {/* Like Button */}
                        <button
                          onClick={() => handleCalendarLikeToggle(event)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: (event as any).user_has_reacted ? '#ef4444' : '#6b7280',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <Heart
                            size={18}
                            fill={(event as any).user_has_reacted ? '#ef4444' : 'none'}
                          />
                          <span>{(event as any).reaction_count || 0}</span>
                        </button>

                        {/* Comments Button */}
                        {Boolean((event as any).allow_comments) && (
                          <button
                            onClick={() => setShowCalendarComments(
                              showCalendarComments === event.calendar_id ? null : event.calendar_id
                            )}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: showCalendarComments === event.calendar_id ? '#22c55e' : '#6b7280',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                              e.currentTarget.style.color = showCalendarComments === event.calendar_id ? '#22c55e' : '#374151';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                              e.currentTarget.style.color = showCalendarComments === event.calendar_id ? '#22c55e' : '#6b7280';
                            }}
                          >
                            <MessageSquare size={18} />
                            <span>{(event as any).comment_count || 0}</span>
                          </button>
                        )}
                      </div>

                      {/* Calendar Event Comments Section */}
                      {showCalendarComments === event.calendar_id && Boolean((event as any).allow_comments) && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                        }}>
                          {currentRole === 'admin' ? (
                            <AdminCommentSection
                              calendarId={event.calendar_id}
                              allowComments={Boolean((event as any).allow_comments)}
                              currentUserId={currentUser?.id}
                              currentUserType="admin"
                            />
                          ) : (
                            <CommentSection
                              calendarId={event.calendar_id}
                              allowComments={Boolean((event as any).allow_comments)}
                              currentUserId={currentUser?.id}
                              currentUserType="student"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else if (item.type === 'announcement') {
                  const announcement = item as any; // Type cast to access announcement properties
                  return (
                    <div
                      key={`announcement-${announcement.announcement_id}`}
                      id={`announcement-${announcement.announcement_id}`}
                      className={`${isFromNotification && scrollTarget === `announcement-${announcement.announcement_id}` ? 'notification-highlight announcement' : ''} ${Boolean(announcement.is_alert) ? 'news-alert' : ''}`.trim()}
                      style={{
                        background: Boolean(announcement.is_alert)
                          ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                        borderRadius: isMobile ? '0.75rem' : '1.25rem', // 12px mobile, 20px desktop
                        padding: isMobile ? '1rem' : '1.75rem', // 16px mobile, 28px desktop
                        border: Boolean(announcement.is_alert)
                          ? '2px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(226, 232, 240, 0.6)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: Boolean(announcement.is_alert)
                          ? '0 8px 32px rgba(239, 68, 68, 0.12), 0 2px 8px rgba(239, 68, 68, 0.08)'
                          : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        margin: isMobile ? '0' : '0', // Remove side margins on mobile for full width
                        overflow: 'hidden',
                        // Ensure proper mobile scaling
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                      }}
                      role={Boolean(announcement.is_alert) ? "status" : undefined}
                      aria-live={Boolean(announcement.is_alert) ? "polite" : undefined}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                        e.currentTarget.style.boxShadow = Boolean(announcement.is_alert)
                          ? '0 16px 48px rgba(239, 68, 68, 0.18), 0 4px 16px rgba(239, 68, 68, 0.12)'
                          : '0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = Boolean(announcement.is_alert)
                          ? '0 8px 32px rgba(239, 68, 68, 0.12), 0 2px 8px rgba(239, 68, 68, 0.08)'
                          : '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)';
                      }}
                    >
                      {/* Alert Badge - Top Right Corner */}
                      {Boolean(announcement.is_alert) && (
                        <span
                          className="badge alert"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                            zIndex: 1
                          }}
                        >
                          <AlertTriangle size={12} color="white" />
                          ALERT
                        </span>
                      )}

                      {/* Announcement Header - Mobile responsive */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: isMobile ? '0.75rem' : '1rem',
                        marginBottom: isMobile ? '0.75rem' : '1rem'
                      }}>
                        {(() => {
                          if (Boolean(announcement.is_alert)) {
                            return (
                              announcement.grade_level ? (
                                <img
                                  src={announcement.grade_level === 11 || announcement.grade_level === '11' 
                                    ? '/logo/g11_logo.png' 
                                    : '/logo/g12_logo.png'}
                                  alt={`Grade ${announcement.grade_level} Logo`}
                                  style={{
                                    width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
                                    height: isMobile ? '2.5rem' : '3rem',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                    border: '3px solid #ef4444'
                                  }}
                                  onError={(e) => {
                                    console.log('Grade logo failed to load:', e.currentTarget.src);
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
                                  height: isMobile ? '2.5rem' : '3rem',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <AlertTriangle size={isMobile ? 20 : 24} color="white" />
                                </div>
                              )
                            );
                          } else {
                            return (
                              announcement.grade_level ? (
                                <img
                                  src={announcement.grade_level === 11 || announcement.grade_level === '11' 
                                    ? '/logo/g11_logo.png' 
                                    : '/logo/g12_logo.png'}
                                  alt={`Grade ${announcement.grade_level} Logo`}
                                  style={{
                                    width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
                                    height: isMobile ? '2.5rem' : '3rem',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0
                                  }}
                                  onError={(e) => {
                                    console.log('Grade logo failed to load:', e.currentTarget.src);
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: isMobile ? '2.5rem' : '3rem', // 40px mobile, 48px desktop
                                  height: isMobile ? '2.5rem' : '3rem',
                                  background: '#e5e7eb',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <User size={isMobile ? 20 : 24} color="#6b7280" />
                                </div>
                              )
                            );
                          }
                        })()}

                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.75rem',
                            flexWrap: 'wrap'
                          }}>
                            {/* Grade Level Text */}
                            {announcement.grade_level && (
                              <span style={{
                                fontWeight: 'bold',
                                fontSize: isMobile ? '1rem' : '1.2rem', // 16px mobile, 19.2px desktop
                                lineHeight: '1.4'
                              }}>
                                GRADE {announcement.grade_level}
                              </span>
                            )}

                            {/* Author Capsule - Fixed layout */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              background: 'rgba(107, 114, 128, 0.1)',
                              padding: isMobile ? '0.375rem 0.75rem' : '0.25rem 0.5rem',
                              borderRadius: '1rem',
                              border: '1px solid rgba(107, 114, 128, 0.2)',
                              fontSize: isMobile ? '0.875rem' : '0.75rem',
                              fontWeight: '500',
                              flexShrink: 0
                            }}>
                              {(() => {
                                if (Boolean(announcement.is_alert)) {
                                  return (
                                    announcement.author_picture ? (
                                      <img
                                        src={getImageUrl(announcement.author_picture) || ''}
                                        alt={announcement.author_name}
                                        style={{
                                          width: isMobile ? '1.125rem' : '1rem', // 18px mobile, 16px desktop
                                          height: isMobile ? '1.125rem' : '1rem',
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          border: '1px solid #ef4444'
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '1.125rem', // 18px consistent
                                        height: '1.125rem',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '0.625rem', // 10px consistent
                                        flexShrink: 0
                                      }}>
                                        !
                                      </div>
                                    )
                                  );
                                } else {
                                  return (
                                    announcement.author_picture ? (
                                      <img
                                        src={getImageUrl(announcement.author_picture) || ''}
                                        alt={announcement.author_name}
                                        style={{
                                          width: isMobile ? '1.125rem' : '1rem', // 18px mobile, 16px desktop
                                          height: isMobile ? '1.125rem' : '1rem',
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          border: '1px solid #e5e7eb'
                                        }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '1.125rem', // 18px consistent
                                        height: '1.125rem',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '0.625rem', // 10px consistent
                                        flexShrink: 0
                                      }}>
                                        {(announcement.author_name || 'A').charAt(0).toUpperCase()}
                                      </div>
                                    )
                                  );
                                }
                              })()}
                              <span style={{
                                fontWeight: '500',
                                color: '#374151',
                                fontSize: isMobile ? '0.875rem' : '0.75rem', // 14px mobile, 12px desktop
                                lineHeight: '1.5'
                              }}>
                                {announcement.author_name || 'Admin'}
                              </span>
                            </div>

                            {/* Category Badge - Fixed positioning */}
                            {(() => {
                              const categoryName = (announcement.category_name || 'GENERAL').toUpperCase();
                              const categoryStyle = getCategoryStyle(categoryName);
                              const IconComponent = categoryStyle.icon;

                              return (
                                <span style={{
                                  background: categoryStyle.background,
                                  color: 'white',
                                  fontSize: '0.75rem', // 12px consistent
                                  fontWeight: '600',
                                  padding: '0.25rem 0.75rem', // Consistent padding
                                  borderRadius: '1rem', // 16px consistent
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  flexShrink: 0,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {React.createElement(IconComponent, { size: 12, color: 'white' })}
                                  {categoryName}
                                </span>
                              );
                            })()}
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            flexWrap: 'wrap'
                          }}>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#6b7280',
                              fontSize: '0.875rem'
                            }}>
                              <Calendar size={14} />
                              {announcement.visibility_end_at && announcement.visibility_start_at
                                ? `${new Date(announcement.visibility_start_at).toLocaleDateString()} - ${new Date(announcement.visibility_end_at).toLocaleDateString()}`
                                : new Date(announcement.visibility_start_at || announcement.visibility_end_at || announcement.created_at).toLocaleDateString()
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: isMobile ? '1.125rem' : '1.5rem', // 18px mobile, 24px desktop - reduced for better mobile fit
                        fontWeight: '700',
                        color: '#1f2937',
                        lineHeight: '1.4',
                        wordWrap: 'break-word', // Ensure long titles wrap properly
                        overflowWrap: 'break-word'
                      }}>
                        {announcement.title}
                      </h3>

                      {/* Images */}
                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <ImageGallery
                          images={announcement.attachments}
                          altPrefix={announcement.title}
                          userRole={currentRole}
                          onImageClick={(index) => {
                            openLightbox(announcement.attachments || [], index);
                          }}
                        />
                      )}

                      {/* Announcement Content */}
                      <div style={{
                        color: '#4b5563',
                        fontSize: isMobile ? '0.875rem' : '0.95rem', // 14px mobile, 15.2px desktop
                        lineHeight: '1.6',
                        marginBottom: isMobile ? '0.75rem' : '1rem',
                        wordWrap: 'break-word', // Ensure long content wraps properly
                        overflowWrap: 'break-word',
                        hyphens: 'auto' // Enable hyphenation for better text flow
                      }}>
                        {announcement.content}
                      </div>

                      {/* Announcement Stats & Actions - Enhanced mobile responsive */}
                      <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row', // Stack vertically on mobile
                        alignItems: isMobile ? 'stretch' : 'center',
                        justifyContent: isMobile ? 'flex-start' : 'space-between',
                        padding: isMobile ? '1rem' : '1rem', // Consistent padding
                        background: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: '0.75rem', // 12px
                        marginBottom: isMobile ? '0.75rem' : '1rem',
                        gap: isMobile ? '0.75rem' : '0'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isMobile ? 'space-around' : 'flex-start', // Distribute evenly on mobile
                          gap: isMobile ? '0.5rem' : '1.5rem',
                          flex: isMobile ? 'none' : 'none',
                          width: isMobile ? '100%' : 'auto'
                        }}>
                          {/* Like Button - Enhanced mobile responsiveness */}
                          <button
                            onClick={() => handleLikeToggle(announcement)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: isMobile ? '0.5rem' : '0.375rem',
                              background: announcement.user_reaction
                                ? (isMobile ? 'rgba(239, 68, 68, 0.1)' : 'none')
                                : (isMobile ? 'rgba(107, 114, 128, 0.05)' : 'none'),
                              border: isMobile ? '1px solid rgba(107, 114, 128, 0.2)' : 'none',
                              color: announcement.user_reaction ? '#ef4444' : '#6b7280',
                              cursor: 'pointer',
                              padding: isMobile ? '0.75rem 1rem' : '0.5rem', // Better mobile padding
                              borderRadius: isMobile ? '0.75rem' : '0.5rem', // 12px mobile, 8px desktop
                              transition: 'all 0.2s ease',
                              fontSize: isMobile ? '0.875rem' : '0.875rem', // 14px consistent
                              fontWeight: '500',
                              minHeight: isMobile ? '3rem' : 'auto', // 48px minimum touch target
                              minWidth: isMobile ? '4rem' : 'auto', // Minimum width for better touch
                              flex: isMobile ? '1' : 'none' // Equal width on mobile
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            <Heart
                              size={18}
                              fill={announcement.user_reaction ? '#ef4444' : 'none'}
                            />
                            <span>{announcement.reaction_count || 0}</span>
                          </button>

                          {/* Comments Button - Enhanced mobile responsiveness */}
                          {Boolean(announcement.allow_comments) && (
                            <button
                              onClick={() => setShowComments(
                                showComments === announcement.announcement_id ? null : announcement.announcement_id
                              )}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: isMobile ? '0.5rem' : '0.375rem',
                                background: showComments === announcement.announcement_id
                                  ? (isMobile ? 'rgba(34, 197, 94, 0.1)' : 'none')
                                  : (isMobile ? 'rgba(107, 114, 128, 0.05)' : 'none'),
                                border: isMobile ? '1px solid rgba(107, 114, 128, 0.2)' : 'none',
                                color: showComments === announcement.announcement_id ? '#22c55e' : '#6b7280',
                                cursor: 'pointer',
                                padding: isMobile ? '0.75rem 1rem' : '0.5rem', // Better mobile padding
                                borderRadius: isMobile ? '0.75rem' : '0.5rem', // 12px mobile, 8px desktop
                                transition: 'all 0.2s ease',
                                fontSize: '0.875rem', // 14px consistent
                                fontWeight: '500',
                                minHeight: isMobile ? '3rem' : 'auto', // 48px minimum touch target
                                minWidth: isMobile ? '4rem' : 'auto', // Minimum width for better touch
                                flex: isMobile ? '1' : 'none' // Equal width on mobile
                              }}
                              onMouseEnter={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.color = '#22c55e';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.background = 'none';
                                  e.currentTarget.style.color = showComments === announcement.announcement_id ? '#22c55e' : '#6b7280';
                                }
                              }}
                              onTouchStart={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                              }}
                              onTouchEnd={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <MessageSquare size={isMobile ? 16 : 18} />
                              <span>{announcement.comment_count || 0}</span>
                            </button>
                          )}


                        </div>

                        {/* Admin Stats - Mobile responsive */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? '0.5rem' : '1rem',
                          fontSize: isMobile ? '0.75rem' : '0.75rem', // 12px consistent
                          color: '#6b7280',
                          flexWrap: isMobile ? 'wrap' : 'nowrap',
                          flex: isMobile ? '1' : 'none'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Users size={isMobile ? 12 : 14} />
                            <span style={{ lineHeight: '1.5' }}>
                              {isMobile ? 'By ' : 'Posted by '}
                              {(announcement as any).posted_by_name || announcement.author_name || 'Admin'}
                            </span>
                          </div>

                          <div style={{
                            padding: '0.25rem 0.5rem',
                            background: announcement.status === 'published'
                              ? 'rgba(34, 197, 94, 0.1)'
                              : 'rgba(107, 114, 128, 0.1)',
                            color: announcement.status === 'published' ? '#22c55e' : '#6b7280',
                            borderRadius: '6px',
                            fontWeight: '500'
                          }}>
                            {announcement.status}
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {showComments === announcement.announcement_id && Boolean(announcement.allow_comments) && (
                        <div style={{
                          marginTop: '1rem',
                          paddingTop: '1rem',
                          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                        }}>
                          {currentRole === 'admin' ? (
                            <AdminCommentSection
                              announcementId={announcement.announcement_id}
                              allowComments={Boolean(announcement.allow_comments)}
                              currentUserId={currentUser?.id}
                              currentUserType="admin"
                            />
                          ) : (
                            <CommentSection
                              announcementId={announcement.announcement_id}
                              allowComments={Boolean(announcement.allow_comments)}
                              currentUserId={currentUser?.id}
                              currentUserType="student"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return null; // Fallback for unknown types
                }
              })}
                </section>
              )}

              {/* Regular Posts Section (Calendar Events & Announcements with is_alert: false) */}
              {regularPosts.length > 0 && (
                <section aria-label="School calendar and regular announcements" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  {/* Regular Section Header (optional, can be removed if not needed) */}
                  {/* {alertPosts.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isMobile ? '1rem' : '1.5rem',
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(22, 163, 74, 0.02) 100%)',
                      borderRadius: '1rem',
                      border: '1px solid rgba(34, 197, 94, 0.1)',
                      margin: isMobile ? '0 0.5rem' : '0'
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Newspaper size={20} color="white" />
                      </div>
                      <div>
                        <h2 style={{
                          margin: 0,
                          fontSize: isMobile ? '1.125rem' : '1.25rem',
                          fontWeight: '700',
                          color: '#16a34a',
                          lineHeight: '1.4'
                        }}>
                          Recent Updates
                        </h2>
                        <p style={{
                          margin: 0,
                          fontSize: isMobile ? '0.875rem' : '0.95rem',
                          color: '#15803d',
                          lineHeight: '1.5'
                        }}>
                          {regularPosts.length} {regularPosts.length === 1 ? 'post' : 'posts'} from school calendar and announcements
                        </p>
                      </div>
                    </div>
                  )} */}

                  {regularPosts.map(item => {
                    // Use the same rendering logic as alert posts, but without alert styling
                    if (item.type === 'event') {
                      const event = item as any; // Type cast to access calendar event properties
                      return (
                        <div
                          key={`regular-event-${event.calendar_id}`}
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                            borderRadius: isMobile ? '0.75rem' : '1.25rem', // 12px mobile, 20px desktop
                            padding: isMobile ? '1rem' : '1.75rem', // 16px mobile, 28px desktop
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            margin: isMobile ? '0' : '0', // Remove side margins on mobile for full width
                            overflow: 'hidden',
                            // Ensure proper mobile scaling
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                            e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)';
                          }}
                        >
                          {/* Event Header - Mobile responsive */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: isMobile ? '0.75rem' : '1rem',
                            marginBottom: isMobile ? '0.75rem' : '1rem'
                          }}>
                            <img
                              src="/logo/vcba1.png"
                              alt="VCBA Logo"
                              style={{
                                width: isMobile ? '3rem' : '4rem',
                                height: isMobile ? '3rem' : '4rem',
                                objectFit: 'contain',
                                flexShrink: 0
                              }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: isMobile ? '0.5rem' : '0.75rem',
                                  flexWrap: isMobile ? 'wrap' : 'nowrap'
                                }}>
                                  <span style={{
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '0.875rem' : '1rem',
                                    lineHeight: '1.5'
                                  }}>
                                    VILLAMOR COLLEGE OF BUSINESS AND ARTS
                                  </span>
                                  {(() => {
                                    const holidayTypeName = event.category_name || 'School Event';
                                    const holidayStyle = getHolidayTypeStyle(holidayTypeName);
                                    const IconComponent = holidayStyle.icon;

                                    return (
                                      <span style={{
                                        background: holidayStyle.background,
                                        color: 'white',
                                        fontSize: isMobile ? '0.625rem' : '0.75rem',
                                        fontWeight: '600',
                                        padding: isMobile ? '0.125rem 0.5rem' : '0.25rem 0.75rem',
                                        borderRadius: '1.25rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        <IconComponent size={isMobile ? 10 : 12} color="white" />
                                        {isMobile ? holidayTypeName.split(' ')[0] : holidayTypeName}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#6b7280',
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  lineHeight: '1.5'
                                }}>
                                  <Calendar size={isMobile ? 12 : 14} />
                                  {event.end_date && event.end_date !== event.event_date
                                    ? `${new Date(event.event_date).toLocaleDateString()} - ${new Date(event.end_date).toLocaleDateString()}`
                                    : new Date(event.event_date).toLocaleDateString()
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          <h3 style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: isMobile ? '1.125rem' : '1.25rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            lineHeight: '1.4'
                          }}>
                            {event.title}
                          </h3>

                          {/* Event Images */}
                          {(() => {
                            const eventImageUrls: string[] = [];

                            if ((event as any).images && (event as any).images.length > 0) {
                              (event as any).images.forEach((img: any) => {
                                if (img.file_path) {
                                  const imageUrl = getImageUrl(img.file_path);
                                  if (imageUrl) {
                                    eventImageUrls.push(imageUrl);
                                  }
                                }
                              });
                            }

                            return eventImageUrls.length > 0 ? (
                              <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
                                <FacebookImageGallery
                                  images={eventImageUrls.filter(Boolean) as string[]}
                                  altPrefix={event.title}
                                  maxVisible={5}
                                  userRole={currentRole}
                                  onImageClick={(index) => {
                                    const filteredImages = eventImageUrls.filter(Boolean) as string[];
                                    openLightboxWithUrls(filteredImages, index);
                                  }}
                                />
                              </div>
                            ) : null;
                          })()}

                          {/* Event Content */}
                          {event.description && (
                            <div style={{
                              color: '#4b5563',
                              fontSize: isMobile ? '0.875rem' : '0.95rem',
                              lineHeight: '1.6',
                              marginBottom: isMobile ? '0.75rem' : '1rem'
                            }}>
                              {event.description}
                            </div>
                          )}

                          {/* Calendar Event Interaction Section */}
                          <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            {/* Like Button */}
                            <button
                              onClick={() => handleCalendarLikeToggle(event)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'none',
                                border: 'none',
                                color: (event as any).user_has_reacted ? '#ef4444' : '#6b7280',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                              }}
                            >
                              <Heart
                                size={18}
                                fill={(event as any).user_has_reacted ? '#ef4444' : 'none'}
                              />
                              <span>{(event as any).reaction_count || 0}</span>
                            </button>

                            {/* Comments Button */}
                            {Boolean((event as any).allow_comments) && (
                              <button
                                onClick={() => setShowCalendarComments(
                                  showCalendarComments === event.calendar_id ? null : event.calendar_id
                                )}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  background: 'none',
                                  border: 'none',
                                  color: showCalendarComments === event.calendar_id ? '#22c55e' : '#6b7280',
                                  cursor: 'pointer',
                                  padding: '0.5rem',
                                  borderRadius: '8px',
                                  transition: 'all 0.2s ease',
                                  fontSize: '0.875rem',
                                  fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                  e.currentTarget.style.color = showCalendarComments === event.calendar_id ? '#22c55e' : '#374151';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'none';
                                  e.currentTarget.style.color = showCalendarComments === event.calendar_id ? '#22c55e' : '#6b7280';
                                }}
                              >
                                <MessageSquare size={18} />
                                <span>{(event as any).comment_count || 0}</span>
                              </button>
                            )}
                          </div>

                          {/* Calendar Event Comments Section */}
                          {showCalendarComments === event.calendar_id && Boolean((event as any).allow_comments) && (
                            <div style={{
                              marginTop: '1rem',
                              paddingTop: '1rem',
                              borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                            }}>
                              {currentRole === 'admin' ? (
                                <AdminCommentSection
                                  calendarId={event.calendar_id}
                                  allowComments={Boolean((event as any).allow_comments)}
                                  currentUserId={currentUser?.id}
                                  currentUserType="admin"
                                />
                              ) : (
                                <CommentSection
                                  calendarId={event.calendar_id}
                                  allowComments={Boolean((event as any).allow_comments)}
                                  currentUserId={currentUser?.id}
                                  currentUserType="student"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    } else if (item.type === 'announcement') {
                      // For announcements, use the same logic as in alert section but without alert styling
                      const announcement = item as any;
                      return (
                        <div
                          key={`regular-announcement-${announcement.announcement_id}`}
                          id={`announcement-${announcement.announcement_id}`}
                          className={`${isFromNotification && scrollTarget === `announcement-${announcement.announcement_id}` ? 'notification-highlight announcement' : ''}`.trim()}
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                            borderRadius: isMobile ? '1rem' : '1.25rem', // 16px mobile, 20px desktop
                            padding: isMobile ? '1.25rem' : '1.75rem', // 20px mobile, 28px desktop
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            margin: isMobile ? '0 0.75rem' : '0', // Increased side margins on mobile
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                            e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)';
                          }}
                        >
                          {/* Regular announcement content - same as alert but without alert styling */}
                          {/* Announcement Header - Mobile responsive */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: isMobile ? '0.75rem' : '1rem',
                            marginBottom: isMobile ? '0.75rem' : '1rem'
                          }}>
                            {announcement.grade_level ? (
                              <img
                                src={announcement.grade_level === 11 || announcement.grade_level === '11'
                                  ? '/logo/g11_logo.png'
                                  : '/logo/g12_logo.png'}
                                alt={`Grade ${announcement.grade_level} Logo`}
                                style={{
                                  width: isMobile ? '2.5rem' : '3rem',
                                  height: isMobile ? '2.5rem' : '3rem',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0
                                }}
                                onError={(e) => {
                                  console.log('Grade logo failed to load:', e.currentTarget.src);
                                }}
                              />
                            ) : (
                              <div style={{
                                width: isMobile ? '2.5rem' : '3rem',
                                height: isMobile ? '2.5rem' : '3rem',
                                background: '#e5e7eb',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <User size={isMobile ? 20 : 24} color="#6b7280" />
                              </div>
                            )}

                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                marginBottom: '0.155rem'
                              }}>
                                {/* Grade Level Text */}
                                {announcement.grade_level && (
                                  <span style={{
                                    fontWeight: 'bold',
                                    fontSize: isMobile ? '1rem' : '1.2rem',
                                    lineHeight: '1.4'
                                  }}>
                                    GRADE {announcement.grade_level}
                                  </span>
                                )}

                                {/* Author Capsule */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  background: 'rgba(107, 114, 128, 0.1)',
                                  padding: isMobile ? '0.25rem 0.5rem' : '0.125rem 0.5rem',
                                  borderRadius: '1rem',
                                  border: '1px solid rgba(107, 114, 128, 0.2)',
                                  fontSize: isMobile ? '0.75rem' : '0.625rem',
                                  fontWeight: '500'
                                }}>
                                  {announcement.author_picture ? (
                                    <img
                                      src={getImageUrl(announcement.author_picture) || ''}
                                      alt={announcement.author_name}
                                      style={{
                                        width: isMobile ? '1.125rem' : '1rem',
                                        height: isMobile ? '1.125rem' : '1rem',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '1px solid #e5e7eb'
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      width: isMobile ? '1.125rem' : '1rem',
                                      height: isMobile ? '1.125rem' : '1rem',
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontWeight: '600',
                                      fontSize: isMobile ? '0.625rem' : '0.5rem'
                                    }}>
                                      {(announcement.author_name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span style={{
                                    fontWeight: '500',
                                    color: '#374151',
                                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                                    lineHeight: '1.5'
                                  }}>
                                    {announcement.author_name || 'Admin'}
                                  </span>
                                </div>

                                {/* Category Badge */}
                                {(() => {
                                  const categoryName = (announcement.category_name || 'GENERAL').toUpperCase();
                                  const categoryStyle = getCategoryStyle(categoryName);
                                  const IconComponent = categoryStyle.icon;

                                  return (
                                    <span style={{
                                      background: categoryStyle.background,
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '20px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      {React.createElement(IconComponent, { size: 12, color: 'white' })}
                                      {categoryName}
                                    </span>
                                  );
                                })()}
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#6b7280',
                                  fontSize: '0.875rem'
                                }}>
                                  <Calendar size={14} />
                                  {announcement.visibility_end_at && announcement.visibility_start_at
                                    ? `${new Date(announcement.visibility_start_at).toLocaleDateString()} - ${new Date(announcement.visibility_end_at).toLocaleDateString()}`
                                    : new Date(announcement.visibility_start_at || announcement.visibility_end_at || announcement.created_at).toLocaleDateString()
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 style={{
                            margin: '0 0 0.75rem 0',
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: '700',
                            color: '#1f2937',
                            lineHeight: '1.4'
                          }}>
                            {announcement.title}
                          </h3>

                          {/* Images */}
                          {announcement.attachments && announcement.attachments.length > 0 && (
                            <ImageGallery
                              images={announcement.attachments}
                              altPrefix={announcement.title}
                              userRole={currentRole}
                              onImageClick={(index) => {
                                openLightbox(announcement.attachments || [], index);
                              }}
                            />
                          )}

                          {/* Announcement Content */}
                          <div style={{
                            color: '#4b5563',
                            fontSize: isMobile ? '0.875rem' : '0.95rem',
                            lineHeight: '1.6',
                            marginBottom: isMobile ? '0.75rem' : '1rem'
                          }}>
                            {announcement.content}
                          </div>

                          {/* Announcement Stats & Actions */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: isMobile ? '0.75rem' : '1rem',
                            background: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '0.75rem',
                            marginBottom: isMobile ? '0.75rem' : '1rem',
                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                            gap: isMobile ? '0.5rem' : '0'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isMobile ? '1rem' : '1.5rem',
                              flex: isMobile ? '1' : 'none'
                            }}>
                              {/* Like Button */}
                              <button
                                onClick={() => handleLikeToggle(announcement)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  background: 'none',
                                  border: 'none',
                                  color: announcement.user_reaction ? '#ef4444' : '#6b7280',
                                  cursor: 'pointer',
                                  padding: isMobile ? '0.75rem 0.5rem' : '0.5rem',
                                  borderRadius: '0.5rem',
                                  transition: 'all 0.2s ease',
                                  fontSize: isMobile ? '0.875rem' : '0.875rem',
                                  fontWeight: '500',
                                  minHeight: isMobile ? '2.75rem' : 'auto'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'none';
                                }}
                              >
                                <Heart
                                  size={18}
                                  fill={announcement.user_reaction ? '#ef4444' : 'none'}
                                />
                                <span>{announcement.reaction_count || 0}</span>
                              </button>

                              {/* Comments Button */}
                              {Boolean(announcement.allow_comments) && (
                                <button
                                  onClick={() => setShowComments(
                                    showComments === announcement.announcement_id ? null : announcement.announcement_id
                                  )}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'none',
                                    border: 'none',
                                    color: showComments === announcement.announcement_id ? '#22c55e' : '#6b7280',
                                    cursor: 'pointer',
                                    padding: isMobile ? '0.75rem 0.5rem' : '0.5rem',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    minHeight: isMobile ? '2.75rem' : 'auto'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isMobile) {
                                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                      e.currentTarget.style.color = '#22c55e';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isMobile) {
                                      e.currentTarget.style.background = 'none';
                                      e.currentTarget.style.color = showComments === announcement.announcement_id ? '#22c55e' : '#6b7280';
                                    }
                                  }}
                                  onTouchStart={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                  }}
                                  onTouchEnd={(e) => {
                                    e.currentTarget.style.background = 'none';
                                  }}
                                >
                                  <MessageSquare size={isMobile ? 16 : 18} />
                                  <span>{announcement.comment_count || 0}</span>
                                </button>
                              )}
                            </div>

                            {/* Admin Stats */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isMobile ? '0.5rem' : '1rem',
                              fontSize: isMobile ? '0.75rem' : '0.75rem',
                              color: '#6b7280',
                              flexWrap: isMobile ? 'wrap' : 'nowrap',
                              flex: isMobile ? '1' : 'none'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <Users size={isMobile ? 12 : 14} />
                                <span style={{ lineHeight: '1.5' }}>
                                  {isMobile ? 'By ' : 'Posted by '}
                                  {(announcement as any).posted_by_name || announcement.author_name || 'Admin'}
                                </span>
                              </div>

                              <div style={{
                                padding: '0.25rem 0.5rem',
                                background: announcement.status === 'published'
                                  ? 'rgba(34, 197, 94, 0.1)'
                                  : 'rgba(107, 114, 128, 0.1)',
                                color: announcement.status === 'published' ? '#22c55e' : '#6b7280',
                                borderRadius: '6px',
                                fontWeight: '500'
                              }}>
                                {announcement.status}
                              </div>
                            </div>
                          </div>

                          {/* Comments Section */}
                          {showComments === announcement.announcement_id && Boolean(announcement.allow_comments) && (
                            <div style={{
                              marginTop: '1rem',
                              paddingTop: '1rem',
                              borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                            }}>
                              {currentRole === 'admin' ? (
                                <AdminCommentSection
                                  announcementId={announcement.announcement_id}
                                  allowComments={Boolean(announcement.allow_comments)}
                                  currentUserId={currentUser?.id}
                                  currentUserType="admin"
                                />
                              ) : (
                                <CommentSection
                                  announcementId={announcement.announcement_id}
                                  allowComments={Boolean(announcement.allow_comments)}
                                  currentUserId={currentUser?.id}
                                  currentUserType="student"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return null; // Fallback for unknown types
                    }
                  })}
                </section>
              )}
            </div>
          )}
          </div>
        </div>
      </div>



      {/* Student Profile Settings Modal */}
      <StudentProfileSettingsModal
        isOpen={showProfileSettings && currentRole === 'student'}
        onClose={() => setShowProfileSettings(false)}
        currentUser={currentUser || null}
      />





      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxInitialIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        altPrefix="Announcement Image"
      />

      {/* Enhanced CSS for Mobile Responsiveness and Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        /* Enhanced mobile responsiveness */
        @media (max-width: 768px) {
          /* Ensure proper text scaling on mobile */
          .news-alert h3,
          .news-alert h2 {
            font-size: clamp(1rem, 4vw, 1.25rem) !important;
            line-height: 1.3 !important;
          }

          /* Improve button touch targets */
          button {
            min-height: 44px !important;
            min-width: 44px !important;
          }

          /* Prevent horizontal overflow */
          * {
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Improve image responsiveness */
          img {
            max-width: 100% !important;
            height: auto !important;
          }

          /* Fix notification bell positioning */
          [data-dropdown="user-dropdown"] {
            position: relative !important;
          }

          /* Ensure proper mobile layout */
          body {
            overflow-x: hidden !important;
          }

          /* Improve mobile scrolling */
          html {
            -webkit-overflow-scrolling: touch !important;
          }
        }

        /* Very small screens (iPhone SE, etc.) */
        @media (max-width: 375px) {
          .news-alert h3,
          .news-alert h2 {
            font-size: clamp(0.9rem, 3.5vw, 1.1rem) !important;
          }

          /* Reduce padding on very small screens */
          .news-alert {
            padding: 0.75rem !important;
          }
        }

        /* Landscape orientation on mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          /* Adjust header height for landscape */
          header {
            height: 3.5rem !important;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          /* Ensure crisp rendering on high DPI screens */
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
      `}</style>
    </div>
  );
};

export default NewsFeed;