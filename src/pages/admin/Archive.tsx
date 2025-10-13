import React, { useState, useEffect } from 'react';
import { Archive as ArchiveIcon, FileText, Calendar, Users, RotateCcw, Trash2, Search, Filter, Image, CreditCard, FolderTree } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { archiveService, ArchiveStatistics } from '../../services/archiveService';
import ArchivedAnnouncements from '../../components/admin/archive/ArchivedAnnouncements';
import ArchivedCalendarEvents from '../../components/admin/archive/ArchivedCalendarEvents';
import ArchivedStudents from '../../components/admin/archive/ArchivedStudents';
import ArchivedAdmins from '../../components/admin/archive/ArchivedAdmins';
import ArchivedWelcomeCards from '../../components/admin/archive/ArchivedWelcomeCards';
import ArchivedCarouselImages from '../../components/admin/archive/ArchivedCarouselImages';
import ArchivedCategories from '../../components/admin/archive/ArchivedCategories';

type ArchiveTab = 'announcements' | 'calendar' | 'students' | 'admins' | 'welcome-cards' | 'carousel-images' | 'categories';

const Archive: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<ArchiveTab>('announcements');
  const [statistics, setStatistics] = useState<ArchiveStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadStatistics();
    } else {
      setError('You must be logged in to access the archive');
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await archiveService.getArchiveStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        setError('Failed to load archive statistics');
        // Set default statistics to prevent UI errors
        setStatistics({
          announcements: 0,
          calendar_events: 0,
          students: 0,
          admins: 0,
          total: 0
        });
      }
    } catch (error: any) {
      console.error('Error loading archive statistics:', error);
      console.error('Error details:', error.response?.data || error);
      console.error('Error status:', error.status);
      console.error('Error response status:', error.response?.status);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Check if it's an authentication error
      if (error.status === 401 || error.response?.status === 401 || error.message?.includes('Authorization')) {
        setError('Authentication failed. Please log in again.');
      } else if (error.status === 403 || error.response?.status === 403) {
        setError('You do not have permission to access the archive.');
      } else if (error.status === 500 || error.response?.status === 500) {
        setError('Server error occurred. Please check the backend logs and try again.');
      } else {
        setError(error.message || error.response?.data?.message || 'Failed to load archive statistics');
      }

      // Set default statistics to prevent UI errors
      setStatistics({
        announcements: 0,
        calendar_events: 0,
        students: 0,
        admins: 0,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'announcements' as ArchiveTab,
      label: 'Announcements',
      icon: FileText,
      count: statistics?.announcements || 0,
      color: '#3b82f6'
    },
    {
      id: 'calendar' as ArchiveTab,
      label: 'Calendar Events',
      icon: Calendar,
      count: statistics?.calendar_events || 0,
      color: '#10b981'
    },
    {
      id: 'students' as ArchiveTab,
      label: 'Students',
      icon: Users,
      count: statistics?.students || 0,
      color: '#f59e0b'
    },
    {
      id: 'admins' as ArchiveTab,
      label: 'Admins',
      icon: Users,
      count: statistics?.admins || 0,
      color: '#dc2626'
    },
    {
      id: 'welcome-cards' as ArchiveTab,
      label: 'Welcome Cards',
      icon: CreditCard,
      count: 0, // Will be updated when statistics include welcome cards
      color: '#8b5cf6'
    },
    {
      id: 'carousel-images' as ArchiveTab,
      label: 'Carousel Images',
      icon: Image,
      count: 0, // Will be updated when statistics include carousel images
      color: '#06b6d4'
    },
    {
      id: 'categories' as ArchiveTab,
      label: 'Categories',
      icon: FolderTree,
      count: 0, // Will be updated when statistics include categories
      color: '#84cc16'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'announcements':
        return <ArchivedAnnouncements onRestoreSuccess={loadStatistics} />;
      case 'calendar':
        return <ArchivedCalendarEvents onRestoreSuccess={loadStatistics} />;
      case 'students':
        return <ArchivedStudents onRestoreSuccess={loadStatistics} />;
      case 'admins':
        return <ArchivedAdmins onRestoreSuccess={loadStatistics} />;
      case 'welcome-cards':
        return <ArchivedWelcomeCards onRestoreSuccess={loadStatistics} />;
      case 'carousel-images':
        return <ArchivedCarouselImages onRestoreSuccess={loadStatistics} />;
      case 'categories':
        return <ArchivedCategories />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading archive data...
        </div>
      </div>
    );
  }

  return (
    <div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab.id ? tab.color : 'transparent'}`,
              color: activeTab === tab.id ? tab.color : '#6b7280',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Archive;
