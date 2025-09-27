import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudentAuth } from '../../../contexts/StudentAuthContext';
import StudentNotificationBell from '../NotificationBell';
import { Newspaper, Settings, GraduationCap, Menu, LogOut } from 'lucide-react';
import { formatDateTime } from '../../../utils/timezone';

interface StudentHeaderProps {
  onToggleSidebar: () => void;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useStudentAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getCurrentTime = () => {
    return formatDateTime(new Date());
  };

  const getPageInfo = () => {
    const path = location.pathname;

    switch (path) {
      case '/student':
      case '/student/newsfeed':
        return {
          title: 'Newsfeed',
          subtitle: 'Latest Updates',
          icon: Newspaper,
          description: 'Stay informed with the latest announcements and news'
        };
      default:
        return {
          title: 'Student Portal',
          subtitle: 'VCBA E-Bulletin Board',
          icon: GraduationCap,
          description: 'Villamor College of Business and Arts, Inc.'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e0f2fe',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 9998
    }}>
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
            fontSize: '1.25rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <Menu size={20} color="#2d5016" />
        </button>

        {/* Page Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <pageInfo.icon size={24} color="#2d5016" />
            <h1 style={{
              margin: 0,
              color: '#1e40af',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              {pageInfo.title}
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #fbbf24 100%)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {pageInfo.subtitle}
            </span>
          </div>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '0.25rem'
          }}>
            {pageInfo.description}
          </p>
          <p style={{
            margin: 0,
            color: '#9ca3af',
            fontSize: '0.75rem'
          }}>
            {getCurrentTime()}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notifications */}
        <StudentNotificationBell />

        {/* User Profile */}
        <div style={{ position: 'relative', zIndex: 10000 }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              if (!showUserMenu) {
                e.currentTarget.style.background = 'none';
              }
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #fbbf24 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem'
            }}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>

            {/* User Info */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '0.9rem',
                lineHeight: '1.2'
              }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '0.75rem',
                lineHeight: '1.2'
              }}>
                Student
              </div>
            </div>

            {/* Dropdown Arrow */}
            <span style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              ▼
            </span>
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0f2fe',
              minWidth: '200px',
              zIndex: 9999
            }}>
              <div style={{ padding: '1rem' }}>
                <div style={{
                  color: '#1e40af',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {user?.email}
                </div>
                
                <hr style={{
                  border: 'none',
                  borderTop: '1px solid #e0f2fe',
                  margin: '1rem 0'
                }} />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#dc2626',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogOut size={16} color="#ef4444" />
                    Logout
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};

export default StudentHeader;
