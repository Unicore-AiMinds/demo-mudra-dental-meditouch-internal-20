import type { ReactNode } from 'react';
import { Menu, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DentalMetrixLogo, MeditouchLogo } from '@/assets/logos';
import ClinicSelector from '@/components/ClinicSelector';
import type { ClinicType } from '@/contexts/ClinicContext';

interface CompactHeaderProps {
  activeClinic: ClinicType;
  setActiveClinic: (clinic: ClinicType) => void;
  toggleSidebar: () => void;
  onOpenSearch: () => void;
  onNewAppointment: () => void;
  notificationsMenu: ReactNode;
  userMenu: ReactNode;
}

// Two-row top bar for phones and tablets (< 1024px). Uses the same menus, search panel
// and New Appointment action as the desktop header; only the arrangement differs.
const CompactHeader = ({
  activeClinic,
  setActiveClinic,
  toggleSidebar,
  onOpenSearch,
  onNewAppointment,
  notificationsMenu,
  userMenu,
}: CompactHeaderProps) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-1 px-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Same as today's phone header: tapping the logo switches clinic. Below 480px only the icon shows. */}
        <button
          onClick={() => setActiveClinic(activeClinic === 'dental' ? 'meditouch' : 'dental')}
          className="rounded focus:outline-none focus:ring-2 focus:ring-blue-500 max-[479px]:[&>div>div:last-child]:hidden"
        >
          {activeClinic === 'dental' ? <DentalMetrixLogo /> : <MeditouchLogo />}
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={onOpenSearch}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <Button
            className={`${
              activeClinic === 'dental'
                ? 'bg-dental-primary hover:bg-dental-dark text-white'
                : 'bg-meditouch-primary hover:bg-meditouch-dark text-white'
            }`}
            onClick={onNewAppointment}
            size="sm"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            <span>New</span>
          </Button>

          {notificationsMenu}
          {userMenu}
        </div>
      </div>

      <div className="px-2 pb-2">
        <ClinicSelector variant="tabs" className="max-w-none" />
      </div>
    </header>
  );
};

export default CompactHeader;
