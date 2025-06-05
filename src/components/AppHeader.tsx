
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClinic } from '@/contexts/ClinicContext';
import { usePatients } from '@/contexts/PatientContext';
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
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const AppHeader = () => {
  const { user, logout } = useAuth();
  const { activeClinic } = useClinic();
  const navigate = useNavigate();
  const { searchPatients } = usePatients();
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toggleSidebar, state } = useSidebar();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a name to search",
        description: "Type a patient's name or phone number to find them.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPatients(searchQuery);
      setSearchResults(results);

      if (results.length === 0) {
        toast({
          title: "No patients found",
          description: `We couldn't find any patients matching "${searchQuery}".`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Something went wrong",
        description: "We couldn't search right now. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle patient selection
  const handlePatientSelect = (patient: any) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    // Navigate to patient details page with the Patient Info tab active
    navigate(`/patients/${patient.id}?tab=overview`);
    toast({
      title: "Opening patient record",
      description: `Showing ${patient.name}'s information.`,
    });
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Reset search when dialog closes
  const handleSearchClose = (open: boolean) => {
    setIsSearchOpen(open);
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
    }
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
            <DentalMetrixLogo /> :
            <MeditouchLogo />
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

            <Sheet open={isSearchOpen} onOpenChange={handleSearchClose}>
              <SheetContent side="top" className="w-full h-auto pt-16 pb-8 px-6">
                <SheetHeader className="mb-6">
                  <SheetTitle>Patient Search</SheetTitle>
                </SheetHeader>
                <div className="flex w-full max-w-xl mx-auto mb-4">
                  <Input
                    placeholder="Search by patient name or contact number..."
                    className="flex-1"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSearching}
                  />
                  <Button
                    className={`ml-2 ${
                      activeClinic === 'dental'
                        ? 'bg-dental-primary hover:bg-dental-dark'
                        : 'bg-meditouch-primary hover:bg-meditouch-dark'
                    }`}
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="w-full max-w-xl mx-auto">
                    <div className="text-sm text-muted-foreground mb-2">
                      Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}:
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {patient.phone} • {patient.email || 'No email'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Patient ID: {patient.patient_code || patient.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            onClick={() => {
              // Navigate to appointments page first
              navigate('/appointments');

              // Use a small timeout to ensure we're on the appointments page
              setTimeout(() => {
                // Dispatch a custom event that the Appointments component will listen for
                window.dispatchEvent(new CustomEvent('openNewAppointmentForm'));
              }, 100);
            }}
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No notifications</h3>
                  <p className="text-muted-foreground mt-2">
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
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
