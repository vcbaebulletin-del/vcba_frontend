import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { useCalendar } from '../../hooks/useCalendar';
import { tvControlService, TVDisplaySettings, TVControlCommand } from '../../services/tvControlService';
import { tvContentSelectionService, TVSelectedContent } from '../../services/tvContentSelectionService';
import { getImageUrl } from '../../config/constants';

import type { Announcement } from '../../types/announcement.types';
import type { CalendarEvent } from '../../types/calendar.types';
import '../../styles/tv.css';

// PowerPoint-style slide component
interface PowerPointSlideProps {
  type: 'announcement' | 'event';
  data: Announcement | CalendarEvent;
}

const PowerPointSlide: React.FC<PowerPointSlideProps> = ({ type, data }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get images based on type
  const images = useMemo(() => {
    if (type === 'announcement') {
      const announcement = data as Announcement;
      // Handle both single image (image_path) and multiple images (attachments/images)
      const imageList = [];

      // Add single image if exists
      if (announcement.image_path) {
        imageList.push({
          url: getImageUrl(announcement.image_path),
          alt: announcement.title
        });
      }

      // Add multiple images from attachments
      if (announcement.images && announcement.images.length > 0) {
        announcement.images.forEach(img => {
          imageList.push({
            url: getImageUrl(img.file_path),
            alt: img.file_name || announcement.title
          });
        });
      }

      return imageList;
    } else {
      // Calendar events - handle images from attachments
      const event = data as CalendarEvent;
      const imageList = [];

      // Add images from event attachments
      if ((event as any).images && Array.isArray((event as any).images)) {
        (event as any).images.forEach((img: any) => {
          if (img.file_path) {
            imageList.push({
              url: getImageUrl(img.file_path),
              alt: img.file_name || event.title
            });
          }
        });
      }

      return imageList;
    }
  }, [type, data]);

  // Get content text
  const getContentText = () => {
    if (type === 'announcement') {
      const announcement = data as Announcement;
      return announcement.content || '';
    } else {
      const event = data as CalendarEvent;
      return event.description || '';
    }
  };

  // Get title
  const getTitle = () => {
    return data.title;
  };

  // Get category info
  const getCategoryInfo = () => {
    if (type === 'announcement') {
      const announcement = data as Announcement;
      return {
        name: announcement.category_name,
        color: announcement.category_color || '#3498db'
      };
    } else {
      return {
        name: 'School Event',
        color: '#e74c3c'
      };
    }
  };



  // Get content data first
  const contentText = getContentText();
  const title = getTitle();
  const category = getCategoryInfo();

  // Check if content should scroll and determine scroll speed
  const [scrollAnimation, setScrollAnimation] = useState<string>('none');

  useEffect(() => {
    const checkScrollNeed = () => {
      if (contentRef.current && contentText) {
        const element = contentRef.current;
        const textElement = element.querySelector('div');
        if (textElement) {
          // Check if text content is longer than container
          const containerHeight = element.clientHeight;
          const textHeight = textElement.scrollHeight;
          const shouldScrollContent = textHeight > containerHeight * 0.8;

          if (shouldScrollContent) {
            // Determine scroll speed based on content length
            const contentLength = contentText.length;
            if (contentLength > 1000) {
              setScrollAnimation('autoScrollSlow 30s linear infinite');
            } else if (contentLength > 500) {
              setScrollAnimation('autoScrollCredits 20s linear infinite');
            } else {
              setScrollAnimation('autoScrollFast 15s linear infinite');
            }
          } else {
            setScrollAnimation('none');
          }

          // shouldScrollContent is used to determine animation
        }
      }
    };

    // Check immediately and after a short delay to ensure proper rendering
    checkScrollNeed();
    const timeout = setTimeout(checkScrollNeed, 500);

    return () => clearTimeout(timeout);
  }, [contentText]);

  // Enhanced image carousel for multiple images
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 5000); // Change image every 5 seconds for better viewing
      return () => clearInterval(interval);
    }
  }, [images.length]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* Category indicator positioned within dark green background */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        zIndex: 1000
      }}>
        <div style={{
          background: category.color,
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '25px',
          fontSize: '1.4rem',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          {category.name}
        </div>
      </div>

      {/* Main content area - full screen */}
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        padding: '4rem 2rem 2rem 2rem', // Top padding to account for category indicator
        gap: '2rem',
        position: 'absolute',
        top: 0,
        left: 0
      }}>
        {/* Content section - conditional width based on images */}
        <div style={{
          flex: images.length > 0 ? '0 0 60%' : '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: images.length > 0 ? '3.5rem' : '4.5rem',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '2rem',
            lineHeight: '1.2',
            textAlign: images.length > 0 ? 'left' : 'center'
          }}>
            {title}
          </h1>

          {/* Content with auto-scroll for long text */}
          {contentText && (
            <div
              ref={contentRef}
              style={{
                fontSize: images.length > 0 ? '2.2rem' : '2.8rem',
                lineHeight: '1.6',
                color: '#374151',
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                textAlign: images.length > 0 ? 'left' : 'center',
                display: 'flex',
                alignItems: images.length > 0 ? 'flex-start' : 'center'
              }}
            >
              <div
                style={{
                  animation: scrollAnimation,
                  width: '100%'
                }}
              >
                {contentText}
              </div>
            </div>
          )}
        </div>

        {/* Image section - only show if images exist */}
        {images.length > 0 && (
          <div style={{
            flex: '0 0 40%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            paddingRight: '2rem' // Add proper spacing from right edge
          }}>
            <div style={{
              width: '100%',
              height: '80%',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.1)' // Subtle background for better image visibility
            }}>
              <img
                key={currentImageIndex} // Force re-render for smooth transitions
                src={images[currentImageIndex]?.url || ''}
                alt={images[currentImageIndex]?.alt || ''}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain', // Show full image without cropping
                  transition: 'all 0.8s ease-in-out', // Smoother, longer transition
                  borderRadius: '20px',
                  opacity: 1
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

              {/* Enhanced image indicators for multiple images */}
              {images.length > 1 && (
                <>
                  {/* Image counter */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}>
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {/* Dot indicators */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px'
                  }}>
                    {images.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: index === currentImageIndex
                            ? 'rgba(255, 255, 255, 0.9)'
                            : 'rgba(255, 255, 255, 0.4)',
                          transition: 'all 0.3s ease',
                          transform: index === currentImageIndex ? 'scale(1.2)' : 'scale(1)'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TVDisplay: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [settings, setSettings] = useState<TVDisplaySettings>(tvControlService.getSettings());
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedContent, setSelectedContent] = useState<TVSelectedContent>(
    tvContentSelectionService.getSelectedContent()
  );
  const slideshowRef = useRef<any>(null);

  // Get current date for calendar hook
  const currentDate = new Date();

  // Fetch announcements (published only, recent first)
  const {
    announcements,
    loading: announcementsLoading,
    error: announcementsError,
    refresh: refreshAnnouncements
  } = useAnnouncements({
    status: 'published',
    page: 1,
    limit: settings.maxAnnouncements,
    sort_by: 'created_at',
    sort_order: 'DESC'
  }, false); // Use student service (no auth required)

  // Fetch calendar events
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refresh: refreshEvents
  } = useCalendar(currentDate);

  // Subscribe to settings and content selection changes
  useEffect(() => {
    const unsubscribeSettings = tvControlService.onSettingsChange(setSettings);
    const unsubscribeContent = tvContentSelectionService.onSelectionChange(setSelectedContent);

    return () => {
      unsubscribeSettings();
      unsubscribeContent();
    };
  }, []);

  // Listen for real-time settings updates via localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage change detected:', e.key, e.newValue);

      if (e.key === 'tv_display_settings') {
        // Settings changed, reload them
        const newSettings = tvControlService.getSettings();
        console.log('Storage event - settings changed:', newSettings);
        setSettings(newSettings);
      } else if (e.key === 'tv_display_settings_updated') {
        // Settings update signal, reload them
        const newSettings = tvControlService.getSettings();
        console.log('Storage event - settings updated:', newSettings);
        setSettings(newSettings);
      } else if (e.key === 'tv_emergency_broadcast') {
        // Emergency broadcast signal
        const newSettings = tvControlService.getSettings();
        console.log('Emergency broadcast detected via storage:', newSettings);
        setSettings(newSettings);
        setRefreshKey(prev => prev + 1);
      } else if (e.key === 'tv_emergency_active') {
        // Emergency active state changed
        const newSettings = tvControlService.getSettings();
        console.log('Emergency active state changed:', e.newValue, newSettings);
        setSettings(newSettings);
        setRefreshKey(prev => prev + 1);
      }
    };

    const handleEmergencyBroadcast = (e: CustomEvent) => {
      console.log('Custom emergency broadcast event:', e.detail);
      const newSettings = tvControlService.getSettings();
      setSettings(newSettings);
      setRefreshKey(prev => prev + 1);
    };

    const handleEmergencyCleared = () => {
      console.log('Emergency cleared event');
      const newSettings = tvControlService.getSettings();
      setSettings(newSettings);
      setRefreshKey(prev => prev + 1);
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('emergency-broadcast', handleEmergencyBroadcast as EventListener);
    window.addEventListener('emergency-cleared', handleEmergencyCleared);

    // Also check for settings changes periodically (for same-tab updates)
    const settingsCheckInterval = setInterval(() => {
      const currentSettings = tvControlService.getSettings();
      if (JSON.stringify(currentSettings) !== JSON.stringify(settings)) {
        console.log('Periodic check - Settings changed:', currentSettings);
        setSettings(currentSettings);
        // Force re-render for emergency messages
        setRefreshKey(prev => prev + 1);
      }
    }, 250); // Check every 250ms for faster emergency response

    // Emergency-specific check
    const emergencyCheckInterval = setInterval(() => {
      const emergencyActive = localStorage.getItem('tv_emergency_active') === 'true';
      const emergencyMessage = localStorage.getItem('tv_emergency_message');

      if (emergencyActive && emergencyMessage && !settings.emergencyActive) {
        console.log('Emergency detected via periodic check:', emergencyMessage);
        const newSettings = tvControlService.getSettings();
        setSettings(newSettings);
        setRefreshKey(prev => prev + 1);
      }
    }, 100); // Check every 100ms for emergency

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('emergency-broadcast', handleEmergencyBroadcast as EventListener);
      window.removeEventListener('emergency-cleared', handleEmergencyCleared);
      clearInterval(settingsCheckInterval);
      clearInterval(emergencyCheckInterval);
    };
  }, [settings]);

  // Send heartbeat to indicate TV is online
  useEffect(() => {
    const sendHeartbeat = () => {
      localStorage.setItem('tv_display_heartbeat', Date.now().toString());
      tvControlService.updateStatus({
        isOnline: true,
        isPlaying,
        currentSlide,
        totalSlides: createSlideContent().length,
        lastRefresh: new Date().toISOString()
      });
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 5000); // Every 5 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isPlaying, currentSlide]);

  // Listen for control commands
  useEffect(() => {
    const checkCommands = () => {
      const commands = tvControlService.getStoredCommands();
      if (commands.length > 0) {
        commands.forEach((command: TVControlCommand) => {
          handleControlCommand(command);
        });
        tvControlService.clearProcessedCommands();
      }
    };

    const commandInterval = setInterval(checkCommands, 1000); // Check every second
    return () => clearInterval(commandInterval);
  }, []);

  // Handle control commands
  const handleControlCommand = (command: TVControlCommand) => {
    switch (command.action) {
      case 'play':
        setIsPlaying(true);
        break;
      case 'pause':
        setIsPlaying(false);
        break;
      case 'next':
        if (slideshowRef.current?.nextSlide) {
          slideshowRef.current.nextSlide();
        }
        break;
      case 'previous':
        if (slideshowRef.current?.prevSlide) {
          slideshowRef.current.prevSlide();
        }
        break;
      case 'refresh':
        refreshAnnouncements();
        refreshEvents();
        setRefreshKey(prev => prev + 1);
        break;
      case 'emergency':
        // Emergency messages are handled through settings
        break;
    }
  };



  // Auto-refresh data every 2 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshAnnouncements();
      refreshEvents();
      setRefreshKey(prev => prev + 1);
    }, 120000); // Refresh every 2 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshAnnouncements, refreshEvents]);

  // Auto-reload page every 10 minutes as backup
  useEffect(() => {
    const reloadInterval = setInterval(() => {
      window.location.reload();
    }, 600000); // Reload every 10 minutes

    return () => clearInterval(reloadInterval);
  }, []);

  // Enhanced fullscreen enforcement for TV Display with modern browser compatibility
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoFullscreen = urlParams.get('autoFullscreen') === 'true';
    const isPopupWindow = window.opener !== null;

    const enforceFullscreen = async () => {
      try {
        // Only attempt automatic fullscreen if requested or in popup
        if (autoFullscreen || isPopupWindow) {
          console.log('TV Display: Attempting automatic fullscreen...');

          // Wait for page to fully load and user interaction to be available
          await new Promise(resolve => setTimeout(resolve, 1000));

          const element = document.documentElement;

          // Check if fullscreen is supported and not already active
          if (document.fullscreenEnabled && !document.fullscreenElement) {
            try {
              if (element.requestFullscreen) {
                await element.requestFullscreen();
                console.log('TV Display: Fullscreen activated successfully');
              } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
                console.log('TV Display: Webkit fullscreen activated');
              } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
                console.log('TV Display: MS fullscreen activated');
              } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
                console.log('TV Display: Mozilla fullscreen activated');
              }
            } catch (fullscreenError: any) {
              console.warn('TV Display: Fullscreen API failed:', fullscreenError.message);

              // Show user-friendly instructions
              if (fullscreenError.name === 'NotAllowedError') {
                showFullscreenPrompt();
              }
            }
          }

          // Fallback window positioning for popup windows
          if (isPopupWindow && window.outerWidth < window.screen.width) {
            try {
              window.moveTo(0, 0);
              window.resizeTo(window.screen.width, window.screen.height);
              console.log('TV Display: Window maximized as fallback');
            } catch (error) {
              console.warn('TV Display: Window positioning failed');
            }
          }
        }
      } catch (error) {
        console.log('TV Display: Fullscreen enforcement completed with fallback');
      }
    };

    // Show fullscreen prompt to user
    const showFullscreenPrompt = () => {
      // Create a temporary overlay with instructions
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
        text-align: center;
        cursor: pointer;
      `;

      overlay.innerHTML = `
        <div style="max-width: 600px; padding: 2rem;">
          <h2 style="font-size: 2.5rem; margin-bottom: 2rem; color: #22c55e;">
            TV Display Ready
          </h2>
          <p style="font-size: 1.5rem; margin-bottom: 2rem; line-height: 1.6;">
            For the best viewing experience, please enter fullscreen mode:
          </p>
          <div style="font-size: 1.3rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 10px;">
            <strong>Press F11</strong> for instant fullscreen
          </div>
          <div style="font-size: 1.1rem; margin-bottom: 2rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
            Or click anywhere on this screen to activate fullscreen
          </div>
          <p style="font-size: 1rem; opacity: 0.8;">
            F11 toggles fullscreen mode • ESC exits fullscreen • Perfect for TV/projector display
          </p>
        </div>
      `;

      // Add click handler to trigger fullscreen and remove overlay
      const handleClick = async () => {
        try {
          const element = document.documentElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if ((element as any).webkitRequestFullscreen) {
            await (element as any).webkitRequestFullscreen();
          } else if ((element as any).msRequestFullscreen) {
            await (element as any).msRequestFullscreen();
          } else if ((element as any).mozRequestFullScreen) {
            await (element as any).mozRequestFullScreen();
          }
        } catch (error) {
          console.warn('Manual fullscreen failed:', error);
        }
        document.body.removeChild(overlay);
      };

      overlay.addEventListener('click', handleClick);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 10000);

      document.body.appendChild(overlay);
    };

    // Anti-tab switching behavior (like educational platforms)
    const handleVisibilityChange = () => {
      if (document.hidden && (isPopupWindow || autoFullscreen)) {
        // Page lost focus - bring it back
        window.focus();
        console.log('TV Display: Focus restored');
      }
    };

    // Enhanced keyboard handling including F11 detection
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 Key Detection and Handling (modern approach using e.key)
      if (e.key === 'F11') {
        console.log('TV Display: F11 key detected - browser will handle fullscreen toggle');

        // We cannot prevent F11's default behavior, but we can coordinate with it
        // The browser will handle entering/exiting fullscreen mode

        // Optional: Show a brief message to user about F11 behavior
        if (!document.fullscreenElement) {
          console.log('TV Display: F11 will enter fullscreen mode');
        } else {
          console.log('TV Display: F11 will exit fullscreen mode');
        }

        // Note: We don't call e.preventDefault() for F11 as it won't work in most browsers
        // and we want to allow the native browser fullscreen behavior
        return;
      }

      // Prevent common exit shortcuts in fullscreen mode (but allow F11)
      if (document.fullscreenElement || isPopupWindow) {
        if (
          (e.altKey && e.key === 'Tab') ||
          (e.ctrlKey && e.key === 'Tab') ||
          e.key === 'Meta' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools
          (e.key === 'F12') // Dev tools
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Additional F-key handling for TV display
      if (e.key.startsWith('F') && e.key !== 'F11') {
        const fKeyNumber = parseInt(e.key.substring(1));
        if (fKeyNumber >= 1 && fKeyNumber <= 12 && fKeyNumber !== 11) {
          // Log other F-key presses for debugging
          console.log(`TV Display: ${e.key} key pressed`);

          // Optionally prevent other F-keys if needed for kiosk mode
          if (isPopupWindow || autoFullscreen) {
            e.preventDefault();
            return false;
          }
        }
      }
    };

    // F11 Fullscreen Change Detection
    const handleF11FullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (isCurrentlyFullscreen) {
        console.log('TV Display: Entered fullscreen mode (possibly via F11)');
        // Optimize display for fullscreen
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
      } else {
        console.log('TV Display: Exited fullscreen mode (possibly via F11 or ESC)');
        // Reset body styles when exiting fullscreen
        document.body.style.overflow = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
      }
    };

    // Apply fullscreen enforcement
    enforceFullscreen();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown, true);

    // Add F11 fullscreen change listeners (cross-browser)
    document.addEventListener('fullscreenchange', handleF11FullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleF11FullscreenChange);
    document.addEventListener('msfullscreenchange', handleF11FullscreenChange);
    document.addEventListener('mozfullscreenchange', handleF11FullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('fullscreenchange', handleF11FullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleF11FullscreenChange);
      document.removeEventListener('msfullscreenchange', handleF11FullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleF11FullscreenChange);
    };
  }, []);





  // Get unique events for TV display (deduplicate multi-day events)
  const uniqueEvents = useMemo(() => {
    const eventMap = new Map();

    events.forEach(event => {
      // Use calendar_id as the unique identifier
      if (!eventMap.has(event.calendar_id)) {
        eventMap.set(event.calendar_id, event);
      }
    });

    const uniqueEventsList = Array.from(eventMap.values()).sort((a, b) => {
      // Sort by event_date, then by title
      const dateA = new Date(a.event_date);
      const dateB = new Date(b.event_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.title.localeCompare(b.title);
    });

    // Debug: Log deduplication results
    console.log(`📊 TV Display - Event deduplication: ${events.length} total events → ${uniqueEventsList.length} unique events`);

    return uniqueEventsList;
  }, [events]);

  // Filter selected events only (using deduplicated events)
  const getSelectedEvents = () => {
    if (!settings.showCalendarEvents || selectedContent.calendarEvents.length === 0) return [];

    return uniqueEvents.filter(event => {
      // Only show events that are explicitly selected
      return selectedContent.calendarEvents.includes(event.calendar_id) && Boolean(event.is_active);
    }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  };

  // Create slide content with new PowerPoint-style design
  const createSlideContent = () => {
    const slides: React.ReactNode[] = [];

    // Add selected announcements only
    if (settings.showAnnouncements && announcements && announcements.length > 0 && selectedContent.announcements.length > 0) {
      const selectedAnnouncements = announcements.filter(announcement => {
        // Only show announcements that are explicitly selected
        return selectedContent.announcements.includes(announcement.announcement_id);
      });

      selectedAnnouncements.forEach((announcement) => (
        slides.push(
          <PowerPointSlide
            key={`announcement-${announcement.announcement_id}-${refreshKey}`}
            type="announcement"
            data={announcement}
          />
        )
      ));
    }

    // Add selected events only
    const selectedEvents = getSelectedEvents();
    if (selectedEvents.length > 0) {
      selectedEvents.forEach((event) => (
        slides.push(
          <PowerPointSlide
            key={`event-${event.calendar_id}-${refreshKey}`}
            type="event"
            data={event}
          />
        )
      ));
    }

    return slides;
  };

  const slides = createSlideContent();
  const isLoading = announcementsLoading || eventsLoading;
  const hasError = announcementsError || eventsError;

  // Custom slideshow logic
  useEffect(() => {
    if (!isPlaying || slides.length === 0 || settings.emergencyActive) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, settings.slideInterval);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length, settings.slideInterval, settings.emergencyActive]);

  // Handle manual slide navigation
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  // Expose slide controls to ref
  useEffect(() => {
    if (slideshowRef.current) {
      slideshowRef.current.nextSlide = nextSlide;
      slideshowRef.current.prevSlide = prevSlide;
    }
  }, [slides.length]);



  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      color: '#ffffff'
    }}>


      {/* Main content area - full screen */}
      <main style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        position: 'relative'
      }}>
        {/* Loading state */}
        {isLoading && (
          <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '8px solid rgba(255, 255, 255, 0.3)',
              borderTop: '8px solid #ffffff',
              borderRadius: '50%',
              animation: 'tv-spin 1s linear infinite',
              marginBottom: '2rem'
            }}></div>
            <div>Loading latest announcements and events...</div>
          </div>
        )}

        {/* Error state */}
        {hasError && !isLoading && (
          <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold', color: '#ffffff' }}>ERROR</div>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Unable to load content</div>
            <div style={{ fontSize: '2rem', opacity: 0.8 }}>
              Please check your internet connection
            </div>
          </div>
        )}

        {/* Emergency Message Override */}
        {settings.emergencyActive && settings.emergencyMessage && (
          console.log('Rendering emergency message:', settings.emergencyMessage),
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(220, 53, 69, 0.95)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'emergency-flash 2s infinite'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '2rem',
              animation: 'emergency-pulse 1s infinite',
              fontWeight: 'bold',
              color: '#ffffff'
            }}>
               EMERGENCY ALERT
            </div>
            
            {/* <div style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '2rem',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              EMERGENCY ALERT
            </div> */}
            <div style={{
              fontSize: '3rem',
              textAlign: 'center',
              lineHeight: '1.4',
              maxWidth: '80%',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '2rem',
              borderRadius: '20px'
            }}>
              {settings.emergencyMessage}
            </div>
          </div>
        )}

        {/* PowerPoint-style slideshow */}
        {!isLoading && !hasError && !settings.emergencyActive && (
          <>
            {slides.length > 0 ? (
              <div style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden'
              }}>
                {/* Current slide */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transition: 'opacity 0.5s ease-in-out'
                }}>
                  {slides[currentSlide]}
                </div>

                {/* Progress indicator */}
                <div style={{
                  position: 'fixed',
                  bottom: '2rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.5rem',
                  zIndex: 1000
                }}>
                  {slides.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: index === currentSlide
                          ? 'rgba(255, 255, 255, 0.9)'
                          : 'rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.3s ease',
                        transform: index === currentSlide ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>

                {/* Slide counter */}
                <div style={{
                  position: 'fixed',
                  top: '2rem',
                  right: '2rem',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  zIndex: 1000
                }}>
                  {currentSlide + 1} / {slides.length}
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                height: '100vh',
                background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '2rem',
                margin: 0,
                position: 'absolute',
                top: 0,
                left: 0
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '2rem', fontWeight: 'bold', opacity: 0.8 }}>
                  📺
                </div>
                <div style={{ fontSize: '3rem', marginBottom: '2rem', fontWeight: 'bold' }}>
                  NO CONTENT SELECTED
                </div>
                <div style={{ fontSize: '2rem', marginBottom: '2rem', opacity: 0.9 }}>
                  {selectedContent.announcements.length === 0 && selectedContent.calendarEvents.length === 0
                    ? 'No content has been selected for TV display'
                    : 'Selected content is not currently available'
                  }
                </div>
                <div style={{ fontSize: '1.5rem', opacity: 0.7 }}>
                  Please use the admin panel to select content for display
                </div>
              </div>
            )}
          </>
        )}
      </main>



      {/* Meta refresh as backup */}
      <meta httpEquiv="refresh" content="600" />
    </div>
  );
};

export default TVDisplay;
