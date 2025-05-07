import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useClinic } from './ClinicContext';
import { useSupabase } from './SupabaseContext';

// Define clinic information types
export interface ClinicOperatingHours {
  id?: string;
  clinic_id?: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface ClinicInfo {
  id?: string;
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
  isLoading: boolean;
  updateClinicInfo: (info: Partial<ClinicInfo>) => Promise<void>;
  updateOperatingHours: (hours: Partial<ClinicOperatingHours>) => Promise<void>;
}

// Default clinic details (used as fallback)
const defaultClinicDetails = {
  dental: {
    name: "Mudra Dental Clinic",
    address: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "+91 9876543210",
    email: "info@mudradental.com",
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
    name: "Mudra Meditouch Clinic",
    address: "456 Park Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400002",
    phone: "+91 9876543211",
    email: "info@mudrameditouch.com",
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
  const { activeClinic, clinics } = useClinic();
  const { supabase } = useSupabase();
  const [clinicInfo, setClinicInfo] = useState<Record<string, ClinicInfo>>(defaultClinicDetails);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch clinic operating hours from Supabase
  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        setIsLoading(true);

        // Get the active clinic from the clinics array
        const dentalClinic = clinics.find(c => c.type === 'dental');
        const meditouchClinic = clinics.find(c => c.type === 'meditouch');

        if (dentalClinic && meditouchClinic) {
          // Fetch operating hours for both clinics
          const dentalHours = await supabase.from<ClinicOperatingHours>('clinic_operating_hours').getAll({
            filters: { clinic_id: dentalClinic.id }
          });

          const meditouchHours = await supabase.from<ClinicOperatingHours>('clinic_operating_hours').getAll({
            filters: { clinic_id: meditouchClinic.id }
          });

          // Initialize operating hours if they don't exist
          if (dentalHours.length === 0) {
            await supabase.from<ClinicOperatingHours>('clinic_operating_hours').insert({
              clinic_id: dentalClinic.id,
              ...defaultClinicDetails.dental.operatingHours
            });
          }

          if (meditouchHours.length === 0) {
            await supabase.from<ClinicOperatingHours>('clinic_operating_hours').insert({
              clinic_id: meditouchClinic.id,
              ...defaultClinicDetails.meditouch.operatingHours
            });
          }

          // Fetch the operating hours again if they were just created
          const updatedDentalHours = dentalHours.length === 0
            ? await supabase.from<ClinicOperatingHours>('clinic_operating_hours').getAll({
                filters: { clinic_id: dentalClinic.id }
              })
            : dentalHours;

          const updatedMeditouchHours = meditouchHours.length === 0
            ? await supabase.from<ClinicOperatingHours>('clinic_operating_hours').getAll({
                filters: { clinic_id: meditouchClinic.id }
              })
            : meditouchHours;

          // Update the clinic info state
          setClinicInfo({
            dental: {
              id: dentalClinic.id,
              name: dentalClinic.name,
              address: dentalClinic.address,
              city: dentalClinic.city,
              state: dentalClinic.state,
              pincode: dentalClinic.pincode,
              phone: dentalClinic.phone,
              email: dentalClinic.email,
              operatingHours: updatedDentalHours[0] || defaultClinicDetails.dental.operatingHours
            },
            meditouch: {
              id: meditouchClinic.id,
              name: meditouchClinic.name,
              address: meditouchClinic.address,
              city: meditouchClinic.city,
              state: meditouchClinic.state,
              pincode: meditouchClinic.pincode,
              phone: meditouchClinic.phone,
              email: meditouchClinic.email,
              operatingHours: updatedMeditouchHours[0] || defaultClinicDetails.meditouch.operatingHours
            }
          });
        }
      } catch (error) {
        console.error('Error fetching clinic info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (clinics.length > 0) {
      fetchClinicInfo();
    }
  }, [clinics, supabase]);

  // Get current clinic info based on active clinic
  const currentClinicInfo = clinicInfo[activeClinic] || defaultClinicDetails[activeClinic];

  // Helper function to get full formatted address
  const getFullAddress = (): string => {
    return `${currentClinicInfo.address}, ${currentClinicInfo.city}, ${currentClinicInfo.state} ${currentClinicInfo.pincode}`;
  };

  // Update clinic info
  const updateClinicInfo = async (info: Partial<ClinicInfo>): Promise<void> => {
    try {
      const clinicId = currentClinicInfo.id;
      if (!clinicId) return;

      // Update clinic in Supabase
      await supabase.from('clinics').update(clinicId, info);

      // Update local state
      setClinicInfo(prev => ({
        ...prev,
        [activeClinic]: {
          ...prev[activeClinic],
          ...info
        }
      }));
    } catch (error) {
      console.error('Error updating clinic info:', error);
      throw error;
    }
  };

  // Update operating hours
  const updateOperatingHours = async (hours: Partial<ClinicOperatingHours>): Promise<void> => {
    try {
      const operatingHoursId = currentClinicInfo.operatingHours.id;
      if (!operatingHoursId) return;

      // Update operating hours in Supabase
      await supabase.from('clinic_operating_hours').update(operatingHoursId, hours);

      // Update local state
      setClinicInfo(prev => ({
        ...prev,
        [activeClinic]: {
          ...prev[activeClinic],
          operatingHours: {
            ...prev[activeClinic].operatingHours,
            ...hours
          }
        }
      }));
    } catch (error) {
      console.error('Error updating operating hours:', error);
      throw error;
    }
  };

  return (
    <ClinicInfoContext.Provider value={{
      currentClinicInfo,
      getFullAddress,
      isLoading,
      updateClinicInfo,
      updateOperatingHours
    }}>
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
