
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { useClinic } from '@/contexts/ClinicContext';
import { useIsMobile } from '@/hooks/use-mobile';

const AppLayout = () => {
  const { activeClinic } = useClinic();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Set page title based on current route and active clinic
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentPage = pathSegments.length > 0 
      ? pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1) 
      : 'Dashboard';
    
    const clinicName = activeClinic === 'dental' ? 'Dental Metrix' : 'Meditouch';
    document.title = `${currentPage} | ${clinicName} - Mudra Clinic`;
  }, [location.pathname, activeClinic]);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-h-screen">
          <AppHeader />
          <main className="flex-1 bg-gray-50 overflow-auto">
            <div className="container mx-auto p-2 sm:p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
