import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';

// Define the service interface
export interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

// Define the context type
interface ServiceContextType {
  dentalServices: Service[];
  meditouchServices: Service[];
  isLoading: boolean;
  addService: (service: Omit<Service, 'id'>, clinic: 'dental' | 'meditouch') => Promise<Service>;
  updateService: (id: number, updates: Partial<Service>, clinic: 'dental' | 'meditouch') => Promise<Service>;
  deleteService: (id: number, clinic: 'dental' | 'meditouch') => Promise<void>;
  getDentalServiceNames: () => string[];
  getMeditouchServiceNames: () => string[];
}

// Create the context
const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// Default services for initialization
const defaultDentalServices: Service[] = [
  { id: 1, name: "General Checkup", duration: 30, price: 500 },
  { id: 2, name: "Teeth Cleaning", duration: 45, price: 1000 },
  { id: 3, name: "Root Canal Treatment", duration: 60, price: 5000 },
  { id: 4, name: "Dental Filling", duration: 30, price: 1500 },
  { id: 5, name: "Crown Placement", duration: 60, price: 8000 },
  { id: 6, name: "Teeth Whitening", duration: 45, price: 4000 }
];

const defaultMeditouchServices: Service[] = [
  { id: 1, name: "Skin Consultation", duration: 30, price: 800 },
  { id: 2, name: "Hair Loss Treatment", duration: 45, price: 1500 },
  { id: 3, name: "Facial", duration: 60, price: 2000 },
  { id: 4, name: "Dermatology Consultation", duration: 30, price: 1000 },
  { id: 5, name: "Hair Transplant Consultation", duration: 45, price: 1200 },
  { id: 6, name: "Acne Treatment", duration: 30, price: 1800 }
];

// Create the provider component
export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const supabase = useSupabase();

  const [dentalServices, setDentalServices] = useState<Service[]>([]);
  const [meditouchServices, setMeditouchServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch services from Supabase here
        // For now, we'll use the default services
        setDentalServices(defaultDentalServices);
        setMeditouchServices(defaultMeditouchServices);
      } catch (error) {
        console.error('Error initializing services:', error);
        toast({
          title: 'Error',
          description: 'Failed to load services. Using default values.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
  }, [toast]);

  // Add a new service
  const addService = async (service: Omit<Service, 'id'>, clinic: 'dental' | 'meditouch'): Promise<Service> => {
    try {
      // Generate a new ID (in a real app, this would be handled by Supabase)
      const newId = clinic === 'dental'
        ? Math.max(0, ...dentalServices.map(s => s.id)) + 1
        : Math.max(0, ...meditouchServices.map(s => s.id)) + 1;

      const newService: Service = {
        id: newId,
        ...service
      };

      // In a real app, you would add the service to Supabase here

      // Update local state
      if (clinic === 'dental') {
        setDentalServices(prev => [...prev, newService]);
      } else {
        setMeditouchServices(prev => [...prev, newService]);
      }

      toast({
        title: 'Success',
        description: `${service.name} has been added to ${clinic} services.`,
      });

      return newService;
    } catch (error) {
      console.error('Error adding service:', error);
      toast({
        title: 'Error',
        description: 'Failed to add service. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a service
  const updateService = async (id: number, updates: Partial<Service>, clinic: 'dental' | 'meditouch'): Promise<Service> => {
    try {
      // In a real app, you would update the service in Supabase here

      // Update local state
      if (clinic === 'dental') {
        const updatedServices = dentalServices.map(service =>
          service.id === id ? { ...service, ...updates } : service
        );
        setDentalServices(updatedServices);
        const updatedService = updatedServices.find(s => s.id === id);
        if (!updatedService) throw new Error('Service not found');
        return updatedService;
      } else {
        const updatedServices = meditouchServices.map(service =>
          service.id === id ? { ...service, ...updates } : service
        );
        setMeditouchServices(updatedServices);
        const updatedService = updatedServices.find(s => s.id === id);
        if (!updatedService) throw new Error('Service not found');
        return updatedService;
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a service
  const deleteService = async (id: number, clinic: 'dental' | 'meditouch'): Promise<void> => {
    try {
      // In a real app, you would delete the service from Supabase here

      // Update local state
      if (clinic === 'dental') {
        setDentalServices(prev => prev.filter(service => service.id !== id));
      } else {
        setMeditouchServices(prev => prev.filter(service => service.id !== id));
      }

      toast({
        title: 'Success',
        description: 'Service has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get all dental service names (for use in other components)
  const getDentalServiceNames = (): string[] => {
    return dentalServices.map(service => service.name);
  };

  // Get all meditouch service names (for use in other components)
  const getMeditouchServiceNames = (): string[] => {
    return meditouchServices.map(service => service.name);
  };

  return (
    <ServiceContext.Provider
      value={{
        dentalServices,
        meditouchServices,
        isLoading,
        addService,
        updateService,
        deleteService,
        getDentalServiceNames,
        getMeditouchServiceNames
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

// Create a hook to use the context
export const useServices = () => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};
