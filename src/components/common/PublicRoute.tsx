import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useStudentAuth } from '../../contexts/StudentAuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
  restricted?: boolean; // If true, authenticated users will be redirected
}

// Admin Public Route Component
const AdminPublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
}) => {
  const { isAuthenticated, user, isLoading } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If route is restricted and user is authenticated, redirect based on role
  if (restricted && isAuthenticated && user) {
    if (user.position === 'super_admin') {
      return <Navigate to="/admin/announcement-approval" replace />;
    } else if (user.position === 'professor') {
      return <Navigate to="/admin/posts" replace />;
    } else {
      // Fallback for any other position
      return <Navigate to="/admin/posts" replace />;
    }
  }

  return <>{children}</>;
};

// Student Public Route Component
const StudentPublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restricted = false,
}) => {
  const { isAuthenticated, user, isLoading } = useStudentAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If route is restricted and user is authenticated, redirect to dashboard
  if (restricted && isAuthenticated && user) {
    return <Navigate to="/student/newsfeed" replace />;
  }

  return <>{children}</>;
};

// Main Public Route Component
const PublicRoute: React.FC<PublicRouteProps> = (props) => {
  const location = useLocation();

  // Determine which public route component to use based on path
  if (location.pathname.startsWith('/admin')) {
    return <AdminPublicRoute {...props} />;
  } else if (location.pathname.startsWith('/student')) {
    return <StudentPublicRoute {...props} />;
  }

  // For other routes, just render children
  return <>{props.children}</>;
};

export default PublicRoute;
