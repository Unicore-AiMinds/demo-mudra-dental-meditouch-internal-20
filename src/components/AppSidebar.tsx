
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  PackageOpen,
  Microscope,
  Users,
  FileText,
  Settings,
  AlertCircle,
  LogOut,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DentalMetrixLogo, MeditouchLogo } from '@/assets/logos';

// Type for navigation items
interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  clinics?: ('dental' | 'meditouch')[];
  roles?: string[]; // Deprecated - kept for backward compatibility
  permissions?: string[]; // New dynamic permission system
  requireAll?: boolean; // Whether user needs ALL permissions or just ONE
}

// Navigation items
const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permissions: ['dashboard.view'],
  },
  {
    title: 'Appointments',
    icon: Calendar,
    path: '/appointments',
    permissions: ['appointments.view'],
  },
  {
    title: 'Patients',
    icon: Users,
    path: '/patients',
    permissions: ['patients.view'],
  },
  {
    title: 'Recall List',
    icon: Clock,
    path: '/recall-list',
    permissions: ['recall_list.view'],
  },
  {
    title: 'Lab Work',
    icon: Microscope,
    path: '/lab',
    clinics: ['dental'],
    permissions: ['lab_work.view'],
  },
  {
    title: 'Stock Tracker',
    icon: PackageOpen,
    path: '/stock',
    clinics: ['dental'],
    permissions: ['stock.view'],
  },
  {
    title: 'Reports',
    icon: FileText,
    path: '/reports',
    permissions: ['reports.view'],
  },
  {
    title: 'Audit Log',
    icon: AlertCircle,
    path: '/audit',
    permissions: ['audit_logs.view'],
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
    permissions: ['settings.view_doctors', 'settings.view_services', 'settings.view_user_management', 'settings.view_roles'],
    requireAll: false, // User needs ANY of these permissions to see Settings
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const { activeClinic } = useClinic();
  const { user, logout } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { state, toggleSidebar } = useSidebar();



  // Check if a nav item should be visible based on clinic and permissions
  const isVisible = (item: NavItem) => {
    // Check clinic restriction first
    if (item.clinics && !item.clinics.includes(activeClinic)) {
      return false;
    }

    // Check dynamic permissions (preferred method)
    if (item.permissions && item.permissions.length > 0) {
      const hasAccess = item.requireAll
        ? hasAllPermissions(item.permissions)
        : hasAnyPermission(item.permissions);
      return hasAccess;
    }

    // Fallback to role-based check (deprecated but kept for backward compatibility)
    if (item.roles && user) {
      return item.roles.includes(user.role);
    }

    // If no restrictions, show the item
    return true;
  };

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="flex flex-col items-center justify-center py-6">
        <div className="mb-4 w-full flex justify-center">
          {activeClinic === 'dental' ? (
            <DentalMetrixLogo />
          ) : (
            <MeditouchLogo />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) =>
            isVisible(item) && (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                  tooltip={item.title}
                >
                  <Link to={item.path}>
                    <item.icon className={cn(
                      "transition-colors",
                      activeClinic === 'dental'
                        ? "group-hover:text-dental-primary"
                        : "group-hover:text-meditouch-primary"
                    )} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
