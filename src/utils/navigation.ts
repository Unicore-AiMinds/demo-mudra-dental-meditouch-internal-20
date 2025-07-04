interface RoutePermission {
  path: string;
  permissions: string[];
  requireAll?: boolean;
  priority: number; // Lower number = higher priority
  clinicRestriction?: ('dental' | 'meditouch')[];
}

// Define routes in order of priority for default landing page
const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/dashboard',
    permissions: ['dashboard.view'],
    priority: 1
  },
  {
    path: '/appointments',
    permissions: ['appointments.view'],
    priority: 2
  },
  {
    path: '/patients',
    permissions: ['patients.view'],
    priority: 3
  },
  {
    path: '/recall-list',
    permissions: ['recall_list.view'],
    priority: 4
  },
  {
    path: '/lab',
    permissions: ['lab_work.view'],
    priority: 5,
    clinicRestriction: ['dental']
  },
  {
    path: '/stock',
    permissions: ['stock.view'],
    priority: 6,
    clinicRestriction: ['dental']
  },
  {
    path: '/reports',
    permissions: ['reports.view'],
    priority: 7
  },
  {
    path: '/audit',
    permissions: ['audit_logs.view'],
    priority: 8
  },
  {
    path: '/settings',
    permissions: ['settings.view_doctors', 'settings.view_services', 'settings.view_user_management', 'settings.view_roles'],
    requireAll: false,
    priority: 9
  }
];

/**
 * Get the default accessible route for a user based on their permissions
 * Uses the same permission checking logic as the sidebar
 * @param hasAnyPermission - Function from PermissionContext
 * @param hasAllPermissions - Function from PermissionContext  
 * @param activeClinic - Current active clinic ('dental' or 'meditouch')
 * @returns The path to redirect the user to, or '/unauthorized' if no access
 */
export function getDefaultAccessibleRoute(
  hasAnyPermission: (permissions: string[]) => boolean,
  hasAllPermissions: (permissions: string[]) => boolean,
  activeClinic: 'dental' | 'meditouch' = 'dental'
): string {
  console.log('🔍 Determining default route using PermissionContext functions');
  console.log('🔍 Active clinic:', activeClinic);

  // Sort routes by priority and find the first accessible one
  const sortedRoutes = [...ROUTE_PERMISSIONS].sort((a, b) => a.priority - b.priority);

  for (const route of sortedRoutes) {
    console.log(`🔍 Checking route: ${route.path} (priority: ${route.priority})`);
    
    // Check clinic restrictions
    if (route.clinicRestriction && !route.clinicRestriction.includes(activeClinic)) {
      console.log(`⏭️ Skipping ${route.path} - clinic restriction (${route.clinicRestriction.join(', ')}) doesn't match ${activeClinic}`);
      continue;
    }

    // Check permissions using the same logic as sidebar
    console.log(`🔍 Checking permissions for ${route.path}:`, route.permissions);
    
    // Special debug for dashboard
    if (route.path === '/dashboard') {
      console.log('🎯 DASHBOARD CHECK:');
      console.log('  - Required permissions:', route.permissions);
      console.log('  - hasAllPermissions result:', hasAllPermissions(route.permissions));
      console.log('  - hasAnyPermission result:', hasAnyPermission(route.permissions));
    }
    
    const hasAccess = route.requireAll !== false
      ? hasAllPermissions(route.permissions)
      : hasAnyPermission(route.permissions);

    console.log(`🔍 Has access to ${route.path}:`, hasAccess);

    if (hasAccess) {
      console.log(`✅ Found accessible route: ${route.path}`);
      return route.path;
    } else {
      console.log(`❌ No access to ${route.path} - missing permissions: ${route.permissions.join(', ')}`);
      
      // If dashboard fails, ensure we continue to check other routes
      if (route.path === '/dashboard') {
        console.log('📌 Dashboard access denied, continuing to check other routes...');
      }
    }
  }

  console.log('🚫 No accessible routes found through priority check');
  
  // Instead of going to unauthorized, find ANY accessible route from sidebar
  console.log('🔄 Attempting to find ANY accessible route...');
  
  // Try each route without priority order
  for (const route of ROUTE_PERMISSIONS) {
    // Skip clinic restricted routes if not in the right clinic
    if (route.clinicRestriction && !route.clinicRestriction.includes(activeClinic)) {
      continue;
    }
    
    const hasAccess = route.requireAll !== false
      ? hasAllPermissions(route.permissions)
      : hasAnyPermission(route.permissions);
      
    if (hasAccess) {
      console.log(`✅ Found fallback accessible route: ${route.path}`);
      return route.path;
    }
  }
  
  // If still no routes found, go to appointments as last resort (most users should have this)
  console.log('⚠️ No accessible routes found at all - defaulting to appointments');
  return '/appointments';
}

/**
 * Get all accessible routes for a user
 * @param hasAnyPermission - Function from PermissionContext
 * @param hasAllPermissions - Function from PermissionContext
 * @param activeClinic - Current active clinic
 * @returns Array of accessible route paths
 */
export function getAccessibleRoutes(
  hasAnyPermission: (permissions: string[]) => boolean,
  hasAllPermissions: (permissions: string[]) => boolean,
  activeClinic: 'dental' | 'meditouch' = 'dental'
): string[] {
  return ROUTE_PERMISSIONS
    .filter(route => {
      // Check clinic restrictions
      if (route.clinicRestriction && !route.clinicRestriction.includes(activeClinic)) {
        return false;
      }

      // Check permissions using the same logic as sidebar
      return route.requireAll
        ? hasAllPermissions(route.permissions)
        : hasAnyPermission(route.permissions);
    })
    .map(route => route.path);
}