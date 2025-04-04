
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  PackageOpen,
  Flask,
  User,
  FileText,
  Settings,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Type for navigation items
interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  clinics?: ('dental' | 'meditouch')[];
  roles?: UserRole[];
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
    icon: Flask,
    path: '/lab',
    clinics: ['dental'],
    roles: ['admin', 'doctor', 'receptionist'],
  },
  {
    title: 'Patients',
    icon: User,
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

// Navigation Link component
const NavItemLink = ({
  collapsed,
  item,
}: {
  collapsed: boolean;
  item: NavItem;
}) => {
  const { activeClinic } = useClinic();
  const { user } = useAuth();

  // Check if this item should be visible based on clinic and role
  const isVisible = 
    (!item.clinics || item.clinics.includes(activeClinic)) && 
    (!item.roles || (user && item.roles.includes(user.role)));

  if (!isVisible) return null;

  // Determine the common styles
  const baseClasses = "flex items-center py-2 px-3 rounded-md transition-colors group";
  const iconClasses = "h-5 w-5";
  
  // When collapsed, show tooltips
  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  baseClasses,
                  isActive 
                    ? `${activeClinic === 'dental' ? 'bg-dental-light text-dental-primary' : 'bg-meditouch-light text-meditouch-primary'}` 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className={iconClasses} />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background border-none">
            {item.title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // When expanded, show normal navigation items
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          baseClasses,
          isActive
            ? `${activeClinic === 'dental' ? 'bg-dental-light text-dental-primary' : 'bg-meditouch-light text-meditouch-primary'}`
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <item.icon className={cn(iconClasses, 'mr-2')} />
      <span className="font-medium text-sm">{item.title}</span>
    </NavLink>
  );
};

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeClinic } = useClinic();

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} h-screen flex flex-col border-r transition-all duration-200`}>
      {/* Nav items */}
      <ScrollArea className="flex-1 py-4 px-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItemLink key={item.title} collapsed={collapsed} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Toggle collapse button */}
      <div className="p-2 border-t">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)} 
          className="w-full h-8 justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default AppSidebar;
