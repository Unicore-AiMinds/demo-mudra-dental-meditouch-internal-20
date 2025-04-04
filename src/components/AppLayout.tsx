
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { useClinic } from '@/contexts/ClinicContext';

const AppLayout = () => {
  const { activeClinic } = useClinic();
  const location = useLocation();
  
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
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
