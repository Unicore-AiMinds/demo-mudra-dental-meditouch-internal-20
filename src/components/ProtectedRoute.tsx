
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[]; // Keep for backward compatibility, but deprecated
  requiredPermissions?: string[]; // New dynamic permission system
  requireAll?: boolean; // Whether user needs ALL permissions or just ONE
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredPermissions,
  requireAll = true
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check dynamic permissions first (preferred method)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      console.log(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
      return <Navigate to="/unauthorized" replace />;
    }
  }
  // Fallback to role-based check (deprecated but kept for backward compatibility)
  else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log(`Access denied. User role: ${user.role}, Allowed roles: ${allowedRoles.join(', ')}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
