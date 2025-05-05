import React, { createContext, useContext, ReactNode } from 'react';
import { useClinic } from './ClinicContext';

// Define clinic information types
export interface ClinicOperatingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  operatingHours: ClinicOperatingHours;
}

interface ClinicInfoContextType {
  currentClinicInfo: ClinicInfo;
  getFullAddress: () => string;
}

// Define clinic details
const clinicDetails = {
  dental: {
    name: "Dental Metrix Clinic",
    address: "Manas apartment, infront of Ambience hotel",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411016",
    phone: "094209 35899",
    email: "contact@dentalmetrix.com",
    operatingHours: {
      monday: "10 am–7 pm",
      tuesday: "10 am–7 pm",
      wednesday: "10 am–7 pm",
      thursday: "10 am–7 pm",
      friday: "10 am–7 pm",
      saturday: "10 am–7 pm",
      sunday: "Closed"
    }
  },
  meditouch: {
    name: "Meditouch Clinic",
    address: "Manas apartment, infront of Ambience hotel",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411016",
    phone: "094209 35899",
    email: "care@meditouchclinic.com",
    operatingHours: {
      monday: "10 am–7 pm",
      tuesday: "10 am–7 pm",
      wednesday: "10 am–7 pm",
      thursday: "10 am–7 pm",
      friday: "10 am–7 pm",
      saturday: "10 am–7 pm",
      sunday: "Closed"
    }
  }
};

// Create the context
const ClinicInfoContext = createContext<ClinicInfoContextType | undefined>(undefined);

// Provider component
export const ClinicInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeClinic } = useClinic();
  
  // Get current clinic info based on active clinic
  const currentClinicInfo = activeClinic === 'dental' 
    ? clinicDetails.dental 
    : clinicDetails.meditouch;
  
  // Helper function to get full formatted address
  const getFullAddress = (): string => {
    return `${currentClinicInfo.address}, Lakad Rd, Rage Path, Model Colony, Shivajinagar, ${currentClinicInfo.city}, ${currentClinicInfo.state} ${currentClinicInfo.pincode}`;
  };
  
  return (
    <ClinicInfoContext.Provider value={{ currentClinicInfo, getFullAddress }}>
      {children}
    </ClinicInfoContext.Provider>
  );
};

// Hook for using clinic info context
export const useClinicInfo = (): ClinicInfoContextType => {
  const context = useContext(ClinicInfoContext);
  if (context === undefined) {
    throw new Error('useClinicInfo must be used within a ClinicInfoProvider');
  }
  return context;
};
