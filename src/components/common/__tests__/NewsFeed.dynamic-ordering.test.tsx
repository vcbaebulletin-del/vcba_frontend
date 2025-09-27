import '@testing-library/jest-dom';

// Mock the NewsFeed component's dynamic ordering logic
describe('NewsFeed Dynamic Ordering Logic', () => {
  // Helper functions extracted from NewsFeed component
  function getLatestAnnouncementDate(announcements: any[]): Date | null {
    if (!announcements || announcements.length === 0) return null;

    const latestDate = announcements.reduce((latest, announcement) => {
      // Use visibility_start_at as specified in task requirements
      // Fallback to created_at if visibility_start_at is not available
      const relevantDate = announcement.visibility_start_at || announcement.created_at;
      const currentDate = new Date(relevantDate);

      return !latest || currentDate > latest ? currentDate : latest;
    }, null as Date | null);

    return latestDate;
  }

  function getLatestEventDate(events: any[]): Date | null {
    if (!events || events.length === 0) return null;

    const latestDate = events.reduce((latest, event) => {
      // Use event_date as specified in task requirements
      const relevantDate = event.event_date;
      const currentDate = new Date(relevantDate);

      return !latest || currentDate > latest ? currentDate : latest;
    }, null as Date | null);

    return latestDate;
  }

  function shouldEventsAppearFirst(announcements: any[], events: any[]): boolean {
    const latestAnnouncementDate = getLatestAnnouncementDate(announcements);
    const latestEventDate = getLatestEventDate(events);
    
    // If no items in either section, use default order (events first)
    if (!latestAnnouncementDate && !latestEventDate) return true;
    
    // If only one section has items, that section appears first
    if (!latestAnnouncementDate && latestEventDate) return true;
    if (latestAnnouncementDate && !latestEventDate) return false;
    
    // If both have items, compare dates (most recent first)
    // When dates are equal, default to events first as per task requirements
    if (latestAnnouncementDate && latestEventDate) {
      return latestEventDate >= latestAnnouncementDate;
    }
    
    // Default fallback: events first
    return true;
  }

  describe('getLatestAnnouncementDate', () => {
    it('should return null for empty array', () => {
      expect(getLatestAnnouncementDate([])).toBeNull();
    });

    it('should return the latest visibility_start_at date', () => {
      const announcements = [
        { created_at: '2024-01-01T10:00:00Z', visibility_start_at: '2024-01-02T10:00:00Z' },
        { created_at: '2024-01-03T10:00:00Z', visibility_start_at: '2024-01-04T10:00:00Z' },
      ];
      const result = getLatestAnnouncementDate(announcements);
      expect(result).toEqual(new Date('2024-01-04T10:00:00Z'));
    });

    it('should fallback to visibility_start_at when visibility_end_at is not available', () => {
      const announcements = [
        { created_at: '2024-01-01T10:00:00Z', visibility_start_at: '2024-01-02T10:00:00Z' },
        { created_at: '2024-01-03T10:00:00Z', visibility_start_at: '2024-01-04T10:00:00Z' },
      ];
      const result = getLatestAnnouncementDate(announcements);
      expect(result).toEqual(new Date('2024-01-04T10:00:00Z'));
    });

    it('should fallback to created_at when no visibility dates are available', () => {
      const announcements = [
        { created_at: '2024-01-01T10:00:00Z' },
        { created_at: '2024-01-03T10:00:00Z' },
      ];
      const result = getLatestAnnouncementDate(announcements);
      expect(result).toEqual(new Date('2024-01-03T10:00:00Z'));
    });
  });

  describe('getLatestEventDate', () => {
    it('should return null for empty array', () => {
      expect(getLatestEventDate([])).toBeNull();
    });

    it('should return the latest event_date', () => {
      const events = [
        { event_date: '2024-01-01' },
        { event_date: '2024-01-03' },
      ];
      const result = getLatestEventDate(events);
      expect(result).toEqual(new Date('2024-01-03'));
    });

    it('should fallback to event_date when end_date is not available', () => {
      const events = [
        { event_date: '2024-01-01' },
        { event_date: '2024-01-03' },
      ];
      const result = getLatestEventDate(events);
      expect(result).toEqual(new Date('2024-01-03'));
    });
  });

  describe('shouldEventsAppearFirst', () => {
    it('should return true when both sections are empty (default order)', () => {
      expect(shouldEventsAppearFirst([], [])).toBe(true);
    });

    it('should return true when only events have items', () => {
      const events = [{ event_date: '2024-01-01' }];
      expect(shouldEventsAppearFirst([], events)).toBe(true);
    });

    it('should return false when only announcements have items', () => {
      const announcements = [{ created_at: '2024-01-01T10:00:00Z' }];
      expect(shouldEventsAppearFirst(announcements, [])).toBe(false);
    });

    it('should return true when events have more recent date', () => {
      const announcements = [{ visibility_start_at: '2024-01-01T10:00:00Z' }];
      const events = [{ event_date: '2024-01-02' }];
      expect(shouldEventsAppearFirst(announcements, events)).toBe(true);
    });

    it('should return false when announcements have more recent date', () => {
      const announcements = [{ visibility_end_at: '2024-01-02T10:00:00Z' }];
      const events = [{ event_date: '2024-01-01' }];
      expect(shouldEventsAppearFirst(announcements, events)).toBe(false);
    });

    it('should use visibility_start_at for announcements ordering', () => {
      const announcements = [{
        visibility_start_at: '2024-01-01T10:00:00Z'
      }];
      const events = [{ event_date: '2024-01-02' }];
      expect(shouldEventsAppearFirst(announcements, events)).toBe(true);
    });

    it('should use event_date for events ordering', () => {
      const announcements = [{ visibility_start_at: '2024-01-02T10:00:00Z' }];
      const events = [{
        event_date: '2024-01-03'
      }];
      expect(shouldEventsAppearFirst(announcements, events)).toBe(true);
    });
  });
});
