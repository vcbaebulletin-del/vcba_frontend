import '@testing-library/jest-dom';

// Mock the NewsFeed component's alert separation logic
describe('NewsFeed Alert Separation Logic', () => {
  // Helper functions extracted from NewsFeed component logic
  function getBaseFilteredAnnouncements(announcements: any[], filters: any = {}) {
    const { searchTerm = '', filterCategory = '', filterGradeLevel = '' } = filters;
    
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

      return matchesSearch && matchesCategory && matchesGradeLevel && isCurrentlyVisible;
    });
  }

  function filterAlertAnnouncements(announcements: any[], filters: any = {}) {
    return getBaseFilteredAnnouncements(announcements, filters).filter(announcement => 
      Boolean(announcement.is_alert)
    );
  }

  function filterRegularAnnouncements(announcements: any[], filters: any = {}) {
    return getBaseFilteredAnnouncements(announcements, filters).filter(announcement => 
      !Boolean(announcement.is_alert)
    );
  }

  function createSortedPosts(items: any[], type: 'event' | 'announcement') {
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
  }

  describe('Alert Announcement Filtering', () => {
    it('should separate alert announcements from regular announcements', () => {
      const announcements = [
        { 
          announcement_id: 1, 
          title: 'Regular Announcement', 
          content: 'Regular content',
          is_alert: false,
          created_at: '2024-01-01T10:00:00Z'
        },
        { 
          announcement_id: 2, 
          title: 'Alert Announcement', 
          content: 'Alert content',
          is_alert: true,
          created_at: '2024-01-02T10:00:00Z'
        },
        { 
          announcement_id: 3, 
          title: 'Another Regular', 
          content: 'Another regular content',
          is_alert: false,
          created_at: '2024-01-03T10:00:00Z'
        }
      ];

      const alertAnnouncements = filterAlertAnnouncements(announcements);
      const regularAnnouncements = filterRegularAnnouncements(announcements);

      expect(alertAnnouncements).toHaveLength(1);
      expect(alertAnnouncements[0].announcement_id).toBe(2);
      expect(alertAnnouncements[0].is_alert).toBe(true);

      expect(regularAnnouncements).toHaveLength(2);
      expect(regularAnnouncements.map(a => a.announcement_id)).toEqual([1, 3]);
      expect(regularAnnouncements.every(a => !Boolean(a.is_alert))).toBe(true);
    });

    it('should handle announcements with undefined is_alert as regular announcements', () => {
      const announcements = [
        { 
          announcement_id: 1, 
          title: 'Undefined Alert', 
          content: 'Content',
          // is_alert is undefined
          created_at: '2024-01-01T10:00:00Z'
        },
        { 
          announcement_id: 2, 
          title: 'Null Alert', 
          content: 'Content',
          is_alert: null,
          created_at: '2024-01-02T10:00:00Z'
        }
      ];

      const alertAnnouncements = filterAlertAnnouncements(announcements);
      const regularAnnouncements = filterRegularAnnouncements(announcements);

      expect(alertAnnouncements).toHaveLength(0);
      expect(regularAnnouncements).toHaveLength(2);
    });

    it('should respect other filters while separating alerts', () => {
      const announcements = [
        { 
          announcement_id: 1, 
          title: 'Math Alert', 
          content: 'Math content',
          is_alert: true,
          category_id: 1,
          created_at: '2024-01-01T10:00:00Z'
        },
        { 
          announcement_id: 2, 
          title: 'Science Alert', 
          content: 'Science content',
          is_alert: true,
          category_id: 2,
          created_at: '2024-01-02T10:00:00Z'
        },
        { 
          announcement_id: 3, 
          title: 'Math Regular', 
          content: 'Math content',
          is_alert: false,
          category_id: 1,
          created_at: '2024-01-03T10:00:00Z'
        }
      ];

      const filters = { filterCategory: '1' }; // Filter by Math category
      const alertAnnouncements = filterAlertAnnouncements(announcements, filters);
      const regularAnnouncements = filterRegularAnnouncements(announcements, filters);

      expect(alertAnnouncements).toHaveLength(1);
      expect(alertAnnouncements[0].announcement_id).toBe(1);

      expect(regularAnnouncements).toHaveLength(1);
      expect(regularAnnouncements[0].announcement_id).toBe(3);
    });
  });

  describe('Post Sorting Logic', () => {
    it('should sort announcements by visibility_end_at (earliest first)', () => {
      const announcements = [
        { 
          announcement_id: 1, 
          title: 'Announcement 1',
          visibility_end_at: '2024-01-03T10:00:00Z',
          created_at: '2024-01-01T10:00:00Z'
        },
        { 
          announcement_id: 2, 
          title: 'Announcement 2',
          visibility_end_at: '2024-01-01T10:00:00Z',
          created_at: '2024-01-02T10:00:00Z'
        },
        { 
          announcement_id: 3, 
          title: 'Announcement 3',
          visibility_end_at: '2024-01-02T10:00:00Z',
          created_at: '2024-01-03T10:00:00Z'
        }
      ];

      const sortedPosts = createSortedPosts(announcements, 'announcement');

      expect(sortedPosts.map(p => p.announcement_id)).toEqual([2, 3, 1]);
      expect(sortedPosts[0].sortDate).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(sortedPosts[1].sortDate).toEqual(new Date('2024-01-02T10:00:00Z'));
      expect(sortedPosts[2].sortDate).toEqual(new Date('2024-01-03T10:00:00Z'));
    });

    it('should sort events by end_date (earliest first)', () => {
      const events = [
        { 
          calendar_id: 1, 
          title: 'Event 1',
          event_date: '2024-01-01',
          end_date: '2024-01-03'
        },
        { 
          calendar_id: 2, 
          title: 'Event 2',
          event_date: '2024-01-02',
          end_date: '2024-01-01'
        },
        { 
          calendar_id: 3, 
          title: 'Event 3',
          event_date: '2024-01-03',
          end_date: '2024-01-02'
        }
      ];

      const sortedPosts = createSortedPosts(events, 'event');

      expect(sortedPosts.map(p => p.calendar_id)).toEqual([2, 3, 1]);
      expect(sortedPosts[0].sortDate).toEqual(new Date('2024-01-01'));
      expect(sortedPosts[1].sortDate).toEqual(new Date('2024-01-02'));
      expect(sortedPosts[2].sortDate).toEqual(new Date('2024-01-03'));
    });

    it('should fallback to event_date when end_date is not available', () => {
      const events = [
        { 
          calendar_id: 1, 
          title: 'Event 1',
          event_date: '2024-01-03'
          // no end_date
        },
        { 
          calendar_id: 2, 
          title: 'Event 2',
          event_date: '2024-01-01'
          // no end_date
        }
      ];

      const sortedPosts = createSortedPosts(events, 'event');

      expect(sortedPosts.map(p => p.calendar_id)).toEqual([2, 1]);
      expect(sortedPosts[0].sortDate).toEqual(new Date('2024-01-01'));
      expect(sortedPosts[1].sortDate).toEqual(new Date('2024-01-03'));
    });

    it('should fallback to visibility_start_at then created_at for announcements', () => {
      const announcements = [
        { 
          announcement_id: 1, 
          title: 'Announcement 1',
          visibility_start_at: '2024-01-02T10:00:00Z',
          created_at: '2024-01-01T10:00:00Z'
          // no visibility_end_at
        },
        { 
          announcement_id: 2, 
          title: 'Announcement 2',
          created_at: '2024-01-01T10:00:00Z'
          // no visibility dates
        }
      ];

      const sortedPosts = createSortedPosts(announcements, 'announcement');

      expect(sortedPosts.map(p => p.announcement_id)).toEqual([2, 1]);
      expect(sortedPosts[0].sortDate).toEqual(new Date('2024-01-01T10:00:00Z'));
      expect(sortedPosts[1].sortDate).toEqual(new Date('2024-01-02T10:00:00Z'));
    });
  });

  describe('Calendar Event Alert Separation', () => {
    it('should separate alert events from regular events', () => {
      const events = [
        { 
          calendar_id: 1, 
          title: 'Regular Event', 
          is_alert: false,
          event_date: '2024-01-01'
        },
        { 
          calendar_id: 2, 
          title: 'Alert Event', 
          is_alert: true,
          event_date: '2024-01-02'
        }
      ];

      const alertEvents = events.filter(event => Boolean(event.is_alert));
      const regularEvents = events.filter(event => !Boolean(event.is_alert));

      expect(alertEvents).toHaveLength(1);
      expect(alertEvents[0].calendar_id).toBe(2);
      expect(alertEvents[0].is_alert).toBe(true);

      expect(regularEvents).toHaveLength(1);
      expect(regularEvents[0].calendar_id).toBe(1);
      expect(regularEvents[0].is_alert).toBe(false);
    });
  });
});
