import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useStudentAuth } from '../../contexts/StudentAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

// Admin Protected Route Component
const AdminProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo,
}) => {
  const { isAuthenticated, user, isLoading } = useAdminAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: '#f9fafb'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Checking authentication...
        </p>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ AdminProtectedRoute - User not authenticated, redirecting to login');
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />;
  }

  // Check role-based access if required role is specified
  if (requiredRole && user.role !== requiredRole) {
    console.log('❌ AdminProtectedRoute - Role mismatch:', { userRole: user.role, requiredRole });
    // Redirect based on user's actual role
    if (user.position === 'super_admin') {
      return <Navigate to="/admin/announcement-approval" replace />;
    } else if (user.position === 'professor') {
      return <Navigate to="/admin/posts" replace />;
    } else {
      // Fallback for any other position
      return <Navigate to="/admin/posts" replace />;
    }
  }

  console.log('✅ AdminProtectedRoute - Access granted');
  return <>{children}</>;
};

// Student Protected Route Component
const StudentProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo,
}) => {
  const { isAuthenticated, user, isLoading } = useStudentAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        background: '#f9fafb'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Checking authentication...
        </p>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ StudentProtectedRoute - User not authenticated, redirecting to login');
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />;
  }

  // Check role-based access if required role is specified
  if (requiredRole && user.role !== requiredRole) {
    console.log('❌ StudentProtectedRoute - Role mismatch:', { userRole: user.role, requiredRole });
    return <Navigate to="/student/newsfeed" replace />;
  }

  console.log('✅ StudentProtectedRoute - Access granted');
  return <>{children}</>;
};

// Main Protected Route Component that routes to appropriate sub-component
const ProtectedRoute: React.FC<ProtectedRouteProps> = (props) => {
  const location = useLocation();

  // Determine which protected route component to use based on path
  if (location.pathname.startsWith('/admin')) {
    return <AdminProtectedRoute {...props} />;
  } else if (location.pathname.startsWith('/student')) {
    return <StudentProtectedRoute {...props} />;
  }

  // Fallback - redirect to unified login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
