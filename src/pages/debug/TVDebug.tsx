import React, { useState, useEffect } from 'react';
import { tvContentSelectionService } from '../../services/tvContentSelectionService';
import { tvControlService } from '../../services/tvControlService';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { useCalendar } from '../../hooks/useCalendar';

const TVDebug: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState(tvContentSelectionService.getSelectedContent());
  const [settings, setSettings] = useState(tvControlService.getSettings());
  const [localStorageData, setLocalStorageData] = useState<any>({});

  // Fetch announcements
  const {
    announcements,
    loading: announcementsLoading
  } = useAnnouncements({
    status: 'published',
    page: 1,
    limit: 50,
    sort_by: 'created_at',
    sort_order: 'DESC'
  }, false);

  // Fetch calendar events
  const {
    events,
    loading: eventsLoading
  } = useCalendar(new Date());

  useEffect(() => {
    // Read all TV-related localStorage data
    const data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tv_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(data);
  }, []);

  const refreshData = () => {
    setSelectedContent(tvContentSelectionService.getSelectedContent());
    setSettings(tvControlService.getSettings());
    
    const data: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tv_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(data);
  };

  const clearAllTVData = () => {
    if (window.confirm('Are you sure you want to clear all TV data from localStorage?')) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tv_')) {
          localStorage.removeItem(key);
        }
      }
      refreshData();
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1 style={{ marginBottom: '2rem' }}>TV Display Debug Panel</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <button onClick={refreshData} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
          🔄 Refresh Data
        </button>
        <button onClick={clearAllTVData} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}>
          🗑️ Clear All TV Data
        </button>
      </div>

      {/* Selected Content */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <h2>📺 Selected Content (from tvContentSelectionService)</h2>
        <pre style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(selectedContent, null, 2)}
        </pre>
      </div>

      {/* TV Settings */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <h2>⚙️ TV Settings (from tvControlService)</h2>
        <pre style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      {/* Fetched Announcements */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <h2>📢 Fetched Announcements ({announcements?.length || 0})</h2>
        {announcementsLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            {announcements && announcements.length > 0 ? (
              <div>
                <p><strong>Total:</strong> {announcements.length}</p>
                <p><strong>Selected IDs:</strong> {selectedContent.announcements.join(', ') || 'None'}</p>
                <p><strong>Matching:</strong> {announcements.filter(a => selectedContent.announcements.includes(a.announcement_id)).length}</p>
                <details>
                  <summary>View All Announcements</summary>
                  <pre style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
                    {JSON.stringify(announcements.map(a => ({
                      id: a.announcement_id,
                      title: a.title,
                      status: a.status,
                      hasImages: !!a.images,
                      imagesCount: a.images?.length || 0,
                      hasImagePath: !!a.image_path
                    })), null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p>No announcements fetched</p>
            )}
          </div>
        )}
      </div>

      {/* Fetched Calendar Events */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <h2>📅 Fetched Calendar Events ({events?.length || 0})</h2>
        {eventsLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            {events && events.length > 0 ? (
              <div>
                <p><strong>Total:</strong> {events.length}</p>
                <p><strong>Selected IDs:</strong> {selectedContent.calendarEvents.join(', ') || 'None'}</p>
                <p><strong>Matching:</strong> {events.filter(e => selectedContent.calendarEvents.includes(e.calendar_id)).length}</p>
                <details>
                  <summary>View All Events</summary>
                  <pre style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto', maxHeight: '400px' }}>
                    {JSON.stringify(events.map(e => ({
                      id: e.calendar_id,
                      title: e.title,
                      date: e.event_date,
                      isActive: e.is_active,
                      hasImages: !!(e as any).images,
                      imagesCount: (e as any).images?.length || 0,
                      hasAttachments: !!e.attachments,
                      attachmentsCount: e.attachments?.length || 0
                    })), null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p>No calendar events fetched</p>
            )}
          </div>
        )}
      </div>

      {/* LocalStorage Data */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
        <h2>💾 LocalStorage TV Data</h2>
        <pre style={{ background: 'white', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(localStorageData, null, 2)}
        </pre>
      </div>

      {/* Diagnosis */}
      <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '2px solid #f59e0b' }}>
        <h2>🔍 Diagnosis</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            <strong>Announcements:</strong> {announcements?.length || 0} fetched, {selectedContent.announcements.length} selected, {
              announcements ? announcements.filter(a => selectedContent.announcements.includes(a.announcement_id)).length : 0
            } matching
          </li>
          <li>
            <strong>Calendar Events:</strong> {events?.length || 0} fetched, {selectedContent.calendarEvents.length} selected, {
              events ? events.filter(e => selectedContent.calendarEvents.includes(e.calendar_id)).length : 0
            } matching
          </li>
          <li>
            <strong>Total Slides:</strong> {
              (announcements ? announcements.filter(a => selectedContent.announcements.includes(a.announcement_id)).length : 0) +
              (events ? events.filter(e => selectedContent.calendarEvents.includes(e.calendar_id)).length : 0)
            }
          </li>
          <li>
            <strong>Will Show "No Content Selected":</strong> {
              ((announcements ? announcements.filter(a => selectedContent.announcements.includes(a.announcement_id)).length : 0) +
              (events ? events.filter(e => selectedContent.calendarEvents.includes(e.calendar_id)).length : 0)) === 0 ? '❌ YES' : '✅ NO'
            }
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TVDebug;

