import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../admin.css';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fdf8 0%, #fffef7 100%)'
    }}>
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: sidebarOpen ? '280px' : '80px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <AdminHeader onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          background: 'transparent',
          overflow: 'auto'
        }}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
