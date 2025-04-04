
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { DentalMetrixLogo, MeditouchLogo } from '@/assets/logos';
import ClinicSelector from './ClinicSelector';
import { useSidebar } from '@/components/ui/sidebar';
import { 
  Search, 
  PlusCircle, 
  Bell, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  User,
  Menu
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const AppHeader = () => {
  const { user, logout } = useAuth();
  const { activeClinic } = useClinic();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toggleSidebar, state } = useSidebar();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Button 
          variant="ghost" 
          size="icon"
          className="mr-2 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex"
        >
          {state === "expanded" ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>

        <div className="ml-2 md:hidden">
          {activeClinic === 'dental' ? 
            <DentalMetrixLogo className="h-8" /> : 
            <MeditouchLogo className="h-8" />
          }
        </div>

        <div className="lg:hidden flex-1 ml-4">
          <ClinicSelector variant="tabs" />
        </div>

        <div className="hidden lg:flex lg:flex-1 ml-4">
          <ClinicSelector />
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          {/* Global Patient Search */}
          <>
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden md:flex"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <SheetContent side="top" className="w-full h-auto pt-16 pb-8 px-6">
                <SheetHeader className="mb-6">
                  <SheetTitle>Patient Search</SheetTitle>
                </SheetHeader>
                <div className="flex w-full max-w-xl mx-auto">
                  <Input 
                    placeholder="Search by patient name or contact number..." 
                    className="flex-1"
                    autoFocus
                  />
                  <Button className="ml-2 bg-dental-primary hover:bg-dental-dark">
                    <Search className="h-4 w-4 mr-2" /> Search
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </>

          {/* New Appointment Button */}
          <Button 
            className={`${
              activeClinic === 'dental' 
                ? 'bg-dental-primary hover:bg-dental-dark text-white' 
                : 'bg-meditouch-primary hover:bg-meditouch-dark text-white'
            }`}
            onClick={() => navigate('/appointments/new')}
            size="sm"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">New Appointment</span>
            <span className="md:hidden">New</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-coral opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-coral"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <div className="flex flex-col gap-2 p-2">
                  <div className="p-2 hover:bg-muted rounded-md cursor-pointer">
                    <div className="text-sm font-medium">Appointment Reminder</div>
                    <div className="text-xs text-muted-foreground">Aarav Sharma's appointment is in 30 minutes</div>
                    <div className="text-xs text-muted-foreground mt-1">10 minutes ago</div>
                  </div>
                  <div className="p-2 hover:bg-muted rounded-md cursor-pointer">
                    <div className="text-sm font-medium">Stock Alert</div>
                    <div className="text-xs text-muted-foreground">Dental composite is running low</div>
                    <div className="text-xs text-muted-foreground mt-1">1 hour ago</div>
                  </div>
                  <div className="p-2 hover:bg-muted rounded-md cursor-pointer">
                    <div className="text-sm font-medium">Lab Work Update</div>
                    <div className="text-xs text-muted-foreground">Vikram Singh's crown is ready for pickup</div>
                    <div className="text-xs text-muted-foreground mt-1">2 hours ago</div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button variant="ghost" className="w-full text-sm">View all notifications</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={activeClinic === 'dental' ? 'bg-dental-light text-dental-dark' : 'bg-meditouch-light text-meditouch-dark'}>
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{user?.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
