import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { usePermissions } from '../../../utils/permissions';
import NotificationBell from '../NotificationBell';
import { BarChart3, Calendar, Newspaper, Users, Settings, School, Menu, User, LogOut, Rss, Archive, FolderTree, UserCog, MessageSquare, Upload, Shield, Layout, FileBarChart, Monitor } from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAdminAuth();
  const permissions = usePermissions(user);
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPageInfo = () => {
    const path = location.pathname;

    switch (path) {
      case '/admin/announcement-approval':
        return {
          title: 'Post Approval',
          subtitle: 'Review & Approve',
          icon: BarChart3,
          description: 'Review and approve pending post'
        };
      case '/admin/newsfeed':
        return {
          title: 'Newsfeed',
          subtitle: 'Monitor Announcements & Events',
          icon: Rss,
          description: 'Monitor announcements, events, and community engagement'
        };
      case '/admin/calendar':
        return {
          title: 'Calendar',
          subtitle: 'Events & Schedule',
          icon: Calendar,
          description: 'Manage academic calendar, events, and announcements'
        };
      case '/admin/posts':
        return {
          title: 'Post',
          subtitle: 'Create & Manage Posts',
          icon: Newspaper,
          description: 'Create and manage announcements, news, and bulletin posts'
        };
      case '/admin/student-management':
        return {
          title: 'Student',
          subtitle: 'Manage Students',
          icon: Users,
          description: 'Manage student accounts, profiles, and academic information'
        };
      case '/admin/categories':
        return {
          title: 'Categories',
          subtitle: 'Manage Categories & Subcategories',
          icon: FolderTree,
          description: 'Manage categories and subcategories for announcements and events'
        };
      case '/admin/admin-management':
        return {
          title: 'Admin Account',
          subtitle: 'Manage Admin Accounts',
          icon: UserCog,
          description: 'Manage administrator accounts and permissions'
        };
      case '/admin/welcome-page-manager':
        return {
          title: 'Welcome Page',
          subtitle: 'Manage Welcome Page & Login Carousel',
          icon: Layout,
          description: 'Manage welcome page content and login carousel images'
        };
      case '/admin/bulk-operations':
        return {
          title: 'Bulk Operations',
          subtitle: 'Import, Export & Bulk Actions',
          icon: Upload,
          description: 'Import, export, and perform bulk actions on system data'
        };
      case '/admin/audit-logs':
        return {
          title: 'Audit Logs',
          subtitle: 'System Activity Monitoring',
          icon: Shield,
          description: 'Monitor and track all system activities and user actions'
        };
      case '/admin/reports':
        return {
          title: 'Reports',
          subtitle: 'Content Activity Reports',
          icon: FileBarChart,
          description: 'Generate and view content activity reports and analytics'
        };
      case '/admin/sms-settings':
        return {
          title: 'SMS Settings',
          subtitle: 'Configure SMS Notifications',
          icon: MessageSquare,
          description: 'Configure SMS notifications and messaging settings'
        };
      case '/admin/archive':
        return {
          title: 'Archive',
          subtitle: 'View Archived Records',
          icon: Archive,
          description: 'View and manage archived announcements, events, and student accounts'
        };
      case '/admin/tv-control':
        return {
          title: 'TV Display',
          subtitle: 'Manage TV Display & Signage',
          icon: Monitor,
          description: 'Manage TV display settings and digital signage content'
        };
      case '/admin/settings':
        return {
          title: 'Settings',
          subtitle: 'Profile & System Settings',
          icon: Settings,
          description: 'Manage your profile, account settings, and preferences'
        };
      default:
        return {
          title: 'VCBA Admin',
          subtitle: 'E-Bulletin Board',
          icon: School,
          description: 'Villamor College of Business and Arts, Inc.'
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e8f5e8',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100
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

        {/* VCBA Logo */}
        {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo/vcba1.png"
            alt="VCBA Logo"
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain'
            }}
          />
        </div> */}

        {/* Page Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <pageInfo.icon size={24} color="#2d5016" />
            <h1 style={{
              margin: 0,
              color: '#2d5016',
              fontSize: '1.5rem',
              fontWeight: '700'
            }}>
              {pageInfo.title}
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
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
        {/* Notifications - Show only for professors */}
        {permissions.isProfessor && <NotificationBell />}

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
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
              background: user?.profilePicture ? 'transparent' : 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              overflow: 'hidden',
              border: '2px solid #e8f5e8'
            }}>
              {user?.profilePicture ? (
                <img
                  src={`http://localhost:5000${user.profilePicture}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    console.log('Profile picture failed to load, falling back to initials');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)';
                      parent.innerHTML = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;
                    }
                  }}
                />
              ) : (
                `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`
              )}
            </div>

            {/* User Info */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                color: '#2d5016',
                fontWeight: '600',
                fontSize: '0.9rem',
                lineHeight: '1.2'
              }}>
                {user?.firstName} {user?.lastName}
              </div>
              {user?.position && (
                <div style={{
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  lineHeight: '1.2'
                }}>
                  {user?.grade_level ? `Grade ${user.grade_level} - ${user.position}` : (user?.position || 'Administrator')}
                </div>
              )}
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
              border: '1px solid #e8f5e8',
              minWidth: '200px',
              zIndex: 1000
            }}>
              <div style={{ padding: '1rem' }}>
                {/* Profile Picture and Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  {/* Profile Picture */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: user?.profilePicture ? 'transparent' : 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    overflow: 'hidden',
                    border: '2px solid #e8f5e8',
                    flexShrink: 0
                  }}>
                    {user?.profilePicture ? (
                      <img
                        src={`http://localhost:5000${user.profilePicture}`}
                        alt={`${user.firstName} ${user.lastName}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          console.log('Dropdown profile picture failed to load, falling back to initials');
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.background = 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)';
                            parent.innerHTML = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;
                          }
                        }}
                      />
                    ) : (
                      `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`
                    )}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <div style={{
                      color: '#2d5016',
                      fontWeight: '600',
                      marginBottom: '0.25rem',
                      fontSize: '0.95rem'
                    }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    {user?.position && (
                      <div style={{
                        color: '#6b7280',
                        fontSize: '0.8rem',
                        marginBottom: '0.25rem'
                      }}>
                        {user?.grade_level ? `Grade ${user.grade_level} - ${user.position}` : (user?.position || 'Administrator')}
                      </div>
                    )}
                  </div>
                </div>
                
                <hr style={{
                  border: 'none',
                  borderTop: '1px solid #e8f5e8',
                  margin: '1rem 0'
                }} />

                {/* ill uncomment this soon */}
                {/* <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/admin/settings');
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#374151',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} color="#6b7280" />
                    Profile Settings
                  </span>
                </button> */}

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

export default AdminHeader;
