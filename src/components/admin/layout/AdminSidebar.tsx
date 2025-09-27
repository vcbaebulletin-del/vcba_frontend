import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Calendar, Newspaper, Users, Settings, Rss, Archive, Monitor, UserCog, FolderTree, MessageSquare, Upload, Shield, Layout, FileBarChart } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { usePermissions } from '../../../utils/permissions';
import './AdminSidebar.css';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  description: string;
  requiresPermission?: (permissions: ReturnType<typeof usePermissions>) => boolean;
}

const navItems: NavItem[] = [
  {
    path: '/admin/announcement-approval',
    label: 'Post Approval',
    icon: BarChart3,
    description: 'Review & Approve Posts',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super admin
  },
    {
    path: '/admin/posts',
    label: 'Post',
    icon: Newspaper,
    description: 'Create & Manage Posts',
    requiresPermission: (permissions) => permissions.isSuperAdmin || permissions.isProfessor 
  },
  {
    path: '/admin/newsfeed',
    label: 'Newsfeed',
    icon: Rss,
    description: 'Monitor Announcements & Events',
    requiresPermission: (permissions) => permissions.isProfessor // Hide from super_admin, show to professor
  },
  {
    path: '/admin/calendar',
    label: 'Calendar',
    icon: Calendar,
    description: 'Events & Schedule',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Hide from super_admin, show to professor
  },
  {
    path: '/admin/student-management',
    label: 'Student',
    icon: Users,
    description: 'Manage Students',
    requiresPermission: (permissions) => permissions.canViewStudents
  },
  {
    path: '/admin/categories',
    label: 'Categories',
    icon: FolderTree,
    description: 'Manage Categories & Subcategories',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  },
  {
    path: '/admin/admin-management',
    label: 'Admin Account',
    icon: UserCog,
    description: 'Manage Admin Accounts',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  },
  {
    path: '/admin/welcome-page-manager',
    label: 'Welcome Page',
    icon: Layout,
    description: 'Manage Welcome Page & Login Carousel',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  },
  {
    path: '/admin/archive',
    label: 'Archive',
    icon: Archive,
    description: 'View Archived Records',
    requiresPermission: (permissions) => permissions.isSuperAdmin
  },
  {
    path: '/admin/tv-control',
    label: 'TV Display',
    icon: Monitor,
    description: 'Manage TV Display & Signage',
    requiresPermission: (permissions) => permissions.isSuperAdmin
  },
  // {
  //   path: '/admin/bulk-operations',
  //   label: 'Bulk Operations',
  //   icon: Upload,
  //   description: 'Import, Export & Bulk Actions',
  //   requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  // },
  {
    path: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: Shield,
    description: 'System Activity Monitoring',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  },
  {
    path: '/admin/reports',
    label: 'Reports',
    icon: FileBarChart,
    description: 'Content Activity Reports',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  },
  {
    path: '/admin/sms-settings',
    label: 'SMS Settings',
    icon: MessageSquare,
    description: 'Configure SMS Notifications',
    requiresPermission: (permissions) => permissions.isSuperAdmin // Show only to super_admin
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    description: 'Profile & System Settings',
    requiresPermission: (permissions) => permissions.isSuperAdmin || permissions.isProfessor // Show to both roles
  }
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user } = useAdminAuth();
  const permissions = usePermissions(user);
  const navRef = useRef<HTMLElement>(null);

  const isActive = (path: string) => {
    return location.pathname === path ||
           (path === '/admin/announcement-approval' && location.pathname === '/admin');
  };

  // Filter navigation items based on permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.requiresPermission) {
      return true; // Always show items without permission requirements
    }
    return item.requiresPermission(permissions);
  });

  // Debug logging for scroll container
  useEffect(() => {
    if (navRef.current) {
      console.log('Scroll container height:', navRef.current.clientHeight);
      console.log('Visible navigation items:', visibleNavItems.length);
    }
  }, [isOpen, visibleNavItems.length]);

  const handleScroll = () => {
    console.log('Sidebar scrolled');
  };

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: isOpen ? '280px' : '80px',
      background: 'linear-gradient(180deg, #2d5016 0%, #1a3009 100%)',
      transition: 'width 0.3s ease',
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo Section - More Compact */}
      <div style={{
        padding: isOpen ? '1rem' : '0.75rem', // Reduced padding
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem', // Reduced gap
        minHeight: '60px', // Reduced height
        flexShrink: 0 // Prevent shrinking
      }}>
        <img
          src="/logo/vcba1.png"
          alt="VCBA Logo"
          style={{
            width: '36px', // Smaller logo
            height: '36px',
            objectFit: 'contain',
            flexShrink: 0
          }}
        />
        {isOpen && (
          <div>
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: '1rem', // Smaller font
              fontWeight: '700',
              lineHeight: '1.1' // Tighter line height
            }}>
              VCBA Admin
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.6875rem', // Smaller subtitle
              lineHeight: '1.1'
            }}>
              E-Bulletin Board
            </p>
            {/* Position Badge - More Compact */}
            {user?.position && (
              <div style={{
                marginTop: '0.375rem', // Reduced margin
                padding: '0.1875rem 0.375rem', // Smaller padding
                background: permissions.getPositionBadgeColor(),
                borderRadius: '3px', // Smaller border radius
                fontSize: '0.5625rem', // Smaller font
                fontWeight: '600',
                color: 'white',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                {permissions.getPositionDisplayName()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation - Scrollable */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0.5rem 0',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
      }}>
        <style>
          {`
            nav::-webkit-scrollbar {
              width: 4px;
            }
            nav::-webkit-scrollbar-track {
              background: transparent;
            }
            nav::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 2px;
            }
            nav::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          `}
        </style>
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isOpen ? '0.75rem' : '0',
              padding: isOpen ? '0.625rem 1rem' : '0.625rem 0.5rem', // More compact padding
              margin: '0.125rem 0.5rem', // Reduced margins
              borderRadius: '6px', // Smaller border radius
              color: isActive(item.path) ? '#facc15' : 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              background: isActive(item.path)
                ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.2) 0%, transparent 100%)'
                : 'transparent',
              borderLeft: isActive(item.path) ? '3px solid #facc15' : '3px solid transparent',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '36px', // Consistent minimum height
              justifyContent: isOpen ? 'flex-start' : 'center'
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }
            }}
          >
            <span style={{
              flexShrink: 0,
              width: '20px', // Smaller icon container
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <item.icon size={18} color={isActive(item.path) ? '#facc15' : 'rgba(255, 255, 255, 0.8)'} />
            </span>
            {isOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: isActive(item.path) ? '600' : '500',
                  fontSize: '0.875rem', // Increased font size for better readability
                  marginBottom: '0.125rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.75rem', // Increased description font size
                  color: isActive(item.path)
                    ? 'rgba(250, 204, 21, 0.8)'
                    : 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.2', // Slightly more relaxed line height
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.description}
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {/* {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1.5rem',
          right: '1.5rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.8rem',
            fontWeight: '600',
            marginBottom: '0.25rem'
          }}>
            Villamor College
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.7rem',
            lineHeight: '1.3'
          }}>
            Business and Arts, Inc.
          </div>
        </div>
      )} */}
    </aside>
  );
};

export default AdminSidebar;