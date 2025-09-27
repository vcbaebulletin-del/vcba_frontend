import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Rss } from 'lucide-react';

interface StudentSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    path: '/student/newsfeed',
    label: 'Newsfeed',
    icon: Rss,
    description: 'Latest Announcements & Events'
  }
];

const StudentSidebar: React.FC<StudentSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      width: isOpen ? '280px' : '80px',
      background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
      transition: 'width 0.3s ease',
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Logo Section */}
      <div style={{
        padding: isOpen ? '1.5rem' : '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minHeight: '80px'
      }}>
        <img
          src="/logo/vcba1.png"
          alt="VCBA Logo"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain',
            flexShrink: 0
          }}
        />
        {isOpen && (
          <div>
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '700',
              lineHeight: '1.2'
            }}>
              Student Portal
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '0.75rem',
              lineHeight: '1.2'
            }}>
              E-Bulletin Board
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: '2rem 0' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: isOpen ? '1.5rem 1.5rem' : '1.5rem',
              color: isActive(item.path) ? '#fbbf24' : 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              background: isActive(item.path) 
                ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.2) 0%, transparent 100%)'
                : 'transparent',
              borderRight: isActive(item.path) ? '3px solid #fbbf24' : '3px solid transparent',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
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
              fontSize: '1.5rem',
              flexShrink: 0,
              width: '24px',
              textAlign: 'center'
            }}>
              <item.icon size={20} color={isActive(item.path) ? '#facc15' : 'rgba(255, 255, 255, 0.8)'} />
            </span>
            {isOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: isActive(item.path) ? '600' : '500',
                  fontSize: '1rem',
                  marginBottom: '0.25rem'
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: isActive(item.path) 
                    ? 'rgba(251, 191, 36, 0.8)' 
                    : 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.2'
                }}>
                  {item.description}
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Welcome Message */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '1.5rem',
          right: '1.5rem',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} color="rgba(255, 255, 255, 0.9)" />
              Welcome Student!
            </span>
          </div>
          <div style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.75rem',
            lineHeight: '1.4'
          }}>
            Stay updated with the latest announcements and manage your profile
          </div>
        </div>
      )}
    </aside>
  );
};

export default StudentSidebar;
