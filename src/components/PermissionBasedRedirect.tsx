import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useClinic } from '@/contexts/ClinicContext';
import { getDefaultAccessibleRoute } from '@/utils/navigation';

/**
 * Component that handles permission-based routing for the root path
 * This component checks user permissions and redirects to the most appropriate page
 */
export const PermissionBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  const { userPermissions, isLoading, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { activeClinic } = useClinic();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If still loading permissions, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // Debug: Log user permissions
  console.log('🚀 PermissionBasedRedirect START');
  console.log('👤 User:', user?.email, user?.role);
  console.log('📋 User permissions count:', userPermissions.length);
  console.log('📋 User permissions:', userPermissions.map(p => `${p.module}.${p.action}`));
  console.log('🏥 Active clinic:', activeClinic);
  
  // Test permission functions directly
  console.log('🧪 Testing permission functions:');
  console.log('  - hasAnyPermission is function?', typeof hasAnyPermission === 'function');
  console.log('  - hasAllPermissions is function?', typeof hasAllPermissions === 'function');
  
  // Test specific permissions
  const testPermissions = ['dashboard.view', 'appointments.view', 'patients.view'];
  testPermissions.forEach(perm => {
    const hasIt = hasAnyPermission([perm]);
    console.log(`  - Has ${perm}?`, hasIt);
  });

  // Determine the appropriate landing page using the same permission functions as sidebar
  const defaultRoute = getDefaultAccessibleRoute(hasAnyPermission, hasAllPermissions, activeClinic);
  console.log('🎯 PermissionBasedRedirect: Final route:', defaultRoute);
  console.log('🚀 PermissionBasedRedirect END');
  
  return <Navigate to={defaultRoute} replace />;
};