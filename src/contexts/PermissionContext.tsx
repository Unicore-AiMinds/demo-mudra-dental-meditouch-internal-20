import React, { createContext, useContext, useState, useEffect } from 'react';
import { Permission, rolePermissionOperations } from '../lib/database/roles';
import { useAuth } from './AuthContext';

// Global permission refresh event
const PERMISSION_REFRESH_EVENT = 'permission-refresh';

// Global function to trigger permission refresh for all users
export const triggerGlobalPermissionRefresh = () => {
  console.log('🔄 Triggering global permission refresh');
  window.dispatchEvent(new CustomEvent(PERMISSION_REFRESH_EVENT));
};

interface PermissionContextType {
  userPermissions: Permission[];
  isLoading: boolean;
  hasPermission: (permission: string) => boolean; // Updated to accept 'module.action' format
  hasAnyPermission: (permissions: string[]) => boolean; // New function
  hasAllPermissions: (permissions: string[]) => boolean; // New function
  canAccess: (requiredPermissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load user permissions
  const loadUserPermissions = async () => {
    if (!user?.id) {
      setUserPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const permissions = await rolePermissionOperations.getUserPermissions(user.id);
      console.log('PermissionContext: Loaded permissions for', user.email, ':', permissions.length, 'permissions');
      setUserPermissions(permissions);
    } catch (error) {
      console.error('PermissionContext: Error loading user permissions:', error);
      setUserPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load permissions when user changes
  useEffect(() => {
    loadUserPermissions();
  }, [user?.id]);

  // Listen for global permission refresh events
  useEffect(() => {
    const handlePermissionRefresh = () => {
      console.log('🔄 Received permission refresh event');
      loadUserPermissions();
    };

    window.addEventListener(PERMISSION_REFRESH_EVENT, handlePermissionRefresh);

    return () => {
      window.removeEventListener(PERMISSION_REFRESH_EVENT, handlePermissionRefresh);
    };
  }, [user?.id]);

  // Check if user has specific permission (accepts 'module.action' format)
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Check actual database permissions for ALL users (including admins)
    const [module, action] = permission.split('.');
    if (!module || !action) return false;

    const hasDbPermission = userPermissions.some(
      perm => perm.module === module && perm.action === action
    );

    // Only log failed permission checks to reduce noise
    if (!hasDbPermission) {
      console.log(`❌ Permission denied: ${user.email} -> ${permission}`);
    }
    return hasDbPermission;
  };

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;

    // Check actual database permissions for ALL users (including admins)
    const result = permissions.some(permission => hasPermission(permission));
    return result;
  };

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;

    // Check actual database permissions for ALL users (including admins)
    const result = permissions.every(permission => hasPermission(permission));
    return result;
  };

  // Check multiple permissions (user needs ALL of them) - alias for hasAllPermissions
  const canAccess = (requiredPermissions: string[]): boolean => {
    return hasAllPermissions(requiredPermissions);
  };

  // Refresh permissions (useful after role changes)
  const refreshPermissions = async () => {
    console.log('🔄 Manual permission refresh triggered for:', user?.email);
    await loadUserPermissions();
  };

  const value: PermissionContextType = {
    userPermissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permissions
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Higher-order component for permission-based rendering
export const withPermission = (
  requiredModule: string,
  requiredAction: string,
  fallback?: React.ReactNode
) => {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function PermissionWrappedComponent(props: P) {
      const { hasPermission } = usePermissions();

      if (!hasPermission(`${requiredModule}.${requiredAction}`)) {
        return fallback || null;
      }

      return <Component {...props} />;
    };
  };
};

// Component for conditional rendering based on permissions
export const PermissionGate: React.FC<{
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ module, action, children, fallback = null }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(`${module}.${action}`)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Component for multiple permission checking
export const MultiPermissionGate: React.FC<{
  permissions: string[]; // Format: ['module.action', 'module.action']
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = need ALL permissions, false = need ANY permission
}> = ({ permissions, children, fallback = null, requireAll = true }) => {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
