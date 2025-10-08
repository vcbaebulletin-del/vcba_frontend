import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { StudentAuthProvider } from './contexts/StudentAuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute, PublicRoute } from './components/common';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/commentDepth.css';
import { AdminLogin, StudentLogin, AdminRegister, UnifiedLogin } from './pages';
import { LOGIN_ROUTE } from './config/constants';
import WelcomePage from './pages/WelcomePage';
import WelcomePageManager from './pages/admin/WelcomePageManager';
import AdminLayout from './components/admin/layout/AdminLayout';

import AnnouncementApproval from './pages/admin/AnnouncementApproval';
import NewsFeed from './components/common/NewsFeed';
import Calendar from './pages/admin/Calendar';
import PostManagement from './pages/admin/PostManagement';
import StudentManagement from './pages/admin/StudentManagement';
import Archive from './pages/admin/Archive';
import Settings from './pages/admin/Settings';
import ApiTest from './pages/debug/ApiTest';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminManagement from './pages/admin/AdminManagement';
import SMSSettings from './pages/admin/SMSSettings';
import BulkOperations from './pages/admin/BulkOperations';
import AuditLogs from './pages/admin/AuditLogs';
import Reports from './pages/admin/Reports';
import StudentLayout from './components/student/layout/StudentLayout';
// Removed unused student pages - using unified NewsFeed and Profile Settings modal
// import StudentDashboard from './pages/student/StudentDashboard'; // REMOVED
// import StudentNewsfeed from './pages/student/StudentNewsfeed'; // Now using unified NewsFeed
// import StudentSettings from './pages/student/StudentSettings'; // REMOVED
import TVDisplay from './pages/tv/TVDisplay';
import TVControlPanel from './components/admin/tv-control/TVControlPanel';
import TVDebug from './pages/debug/TVDebug';
import './App.css';

// Smart redirect component that redirects to the unified login page
const SmartRedirect: React.FC = () => {
  const location = useLocation();

  // Always redirect to the unified login page
  // The unified login will handle user type selection
  return <Navigate to={LOGIN_ROUTE} state={{ from: location }} replace />;
};

// Smart admin dashboard redirect based on user role
const AdminDashboardRedirect: React.FC = () => {
  const { user } = useAdminAuth();

  if (!user) {
    return <Navigate to={LOGIN_ROUTE} replace />;
  }

  if (user.position === 'super_admin') {
    return <Navigate to="/admin/announcement-approval" replace />;
  } else if (user.position === 'professor') {
    return <Navigate to="/admin/posts" replace />;
  } else {
    // Fallback for any other position
    return <Navigate to="/admin/posts" replace />;
  }
};

// Admin Routes Component with isolated auth context
const AdminRoutes: React.FC = () => (
  <AdminAuthProvider>
    <Routes>
      {/* Legacy admin login route - redirect to unified login */}
      <Route
        path="/login"
        element={<Navigate to={LOGIN_ROUTE} replace />}
      />

      <Route
        path="/register"
        element={
          <PublicRoute restricted>
            <ErrorBoundary>
              <AdminRegister />
            </ErrorBoundary>
          </PublicRoute>
        }
      />

      {/* Admin protected routes with layout */}
      <Route
        path="/announcement-approval"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AnnouncementApproval />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/newsfeed"
        element={
          <ProtectedRoute requiredRole="admin">
            <NewsFeed userRole="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <Calendar />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/posts"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <PostManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-management"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <StudentManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <CategoryManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-management"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AdminManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bulk-operations"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <BulkOperations />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <AuditLogs />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <Reports />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sms-settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <SMSSettings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <Archive />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tv-control"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <TVControlPanel />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/welcome-page-manager"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout>
              <WelcomePageManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/debug"
        element={
          <ProtectedRoute requiredRole="admin">
            <ApiTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardRedirect />
          </ProtectedRoute>
        }
      />
    </Routes>
  </AdminAuthProvider>
);

// Student Routes Component with isolated auth context
const StudentRoutes: React.FC = () => (
  <StudentAuthProvider>
    <Routes>
      {/* Legacy student login route - redirect to unified login */}
      <Route
        path="/login"
        element={<Navigate to={LOGIN_ROUTE} replace />}
      />

      {/* Student protected routes - using unified NewsFeed only */}
      <Route
        path="/newsfeed"
        element={
          <ProtectedRoute requiredRole="student">
            <NewsFeed userRole="student" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute requiredRole="student">
            <Navigate to="/student/newsfeed" replace />
          </ProtectedRoute>
        }
      />
    </Routes>
  </StudentAuthProvider>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Welcome page as default route - wrapped with StudentAuthProvider */}
            <Route path="/" element={
              <StudentAuthProvider>
                <WelcomePage />
              </StudentAuthProvider>
            } />

            {/* TV Display routes - no authentication required */}
            <Route path="/tv-display" element={<TVDisplay />} />
            <Route path="/tv" element={<TVDisplay />} />
            <Route path="/tv-debug" element={<TVDebug />} />

            {/* Unified Login route - accessible from both admin and student contexts */}
            <Route path={LOGIN_ROUTE} element={
              <AdminAuthProvider>
                <StudentAuthProvider>
                  <PublicRoute restricted>
                    <UnifiedLogin />
                  </PublicRoute>
                </StudentAuthProvider>
              </AdminAuthProvider>
            } />

            {/* Admin routes with isolated auth context */}
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* Student routes with isolated auth context */}
            <Route path="/student/*" element={<StudentRoutes />} />

            {/* Catch all route - smart redirect based on path */}
            <Route path="*" element={<SmartRedirect />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
