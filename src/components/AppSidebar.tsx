
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DentalMetrixLogo, MeditouchLogo } from '@/assets/logos';

// Type for navigation items
interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  clinics?: ('dental' | 'meditouch')[];
  roles?: string[];
}

// Navigation items
const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    title: 'Appointments',
    icon: Calendar,
    path: '/appointments',
  },
  {
    title: 'Stock Tracker',
    icon: PackageOpen,
    path: '/stock',
    clinics: ['dental'],
    roles: ['admin', 'inventory'],
  },
  {
    title: 'Lab Work',
    icon: Microscope,
    path: '/lab',
    clinics: ['dental'],
    roles: ['admin', 'doctor', 'receptionist'],
  },
  {
    title: 'Patients',
    icon: Users,
    path: '/patients',
  },
  {
    title: 'Reports',
    icon: FileText,
    path: '/reports',
    roles: ['admin'],
  },
  {
    title: 'Audit Log',
    icon: AlertCircle,
    path: '/audit',
    roles: ['admin'],
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
    roles: ['admin'],
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const { activeClinic } = useClinic();
  const { user, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();

  // Check if a nav item should be visible based on clinic and role
  const isVisible = (item: NavItem) => {
    return (!item.clinics || item.clinics.includes(activeClinic)) && 
      (!item.roles || (user && item.roles.includes(user.role)));
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
