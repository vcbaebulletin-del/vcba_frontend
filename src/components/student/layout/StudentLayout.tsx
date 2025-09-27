import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import StudentHeader from './StudentHeader';
import '../student.css';

interface StudentLayoutProps {
  children?: React.ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'linear-gradient(135deg, #f0f9ff 0%, #fefce8 100%)',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <StudentSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: sidebarOpen ? '280px' : '80px',
        transition: 'margin-left 0.3s ease',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <StudentHeader onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main style={{
          flex: 1,
          background: 'transparent',
          overflow: 'hidden',
          height: 'calc(100vh - 80px)', // Subtract header height
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            overflow: 'auto',
            padding: '2rem'
          }}>
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
