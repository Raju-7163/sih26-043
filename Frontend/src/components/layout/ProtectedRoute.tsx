import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    // Save intended URL in query parameter so login can redirect back
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${returnUrl}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned role dashboard if accessing unauthorized route
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <>{children}</>;
};
