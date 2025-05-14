import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';

// Define the service interface
export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  clinic_type: 'dental' | 'meditouch';
  created_at?: string;
  updated_at?: string;
}

// Define the service with follow-up interface
export interface ServiceWithFollowUp {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  requires_follow_up: boolean;
  default_follow_up_interval_days?: number;
  number_of_follow_ups?: number;
  follow_up_service_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the context type
interface ServiceContextType {
  dentalServices: Service[];
  meditouchServices: Service[];
  servicesWithFollowUp: ServiceWithFollowUp[];
  isLoading: boolean;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<Service>;
  updateService: (id: string, updates: Partial<Service>) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  addServiceWithFollowUp: (service: Omit<ServiceWithFollowUp, 'id' | 'created_at' | 'updated_at'>) => Promise<ServiceWithFollowUp>;
  updateServiceWithFollowUp: (id: string, updates: Partial<ServiceWithFollowUp>) => Promise<ServiceWithFollowUp>;
  deleteServiceWithFollowUp: (id: string) => Promise<void>;
  getDentalServiceNames: () => string[];
  getMeditouchServiceNames: () => string[];
  getServiceByName: (name: string, clinicType: 'dental' | 'meditouch') => Service | undefined;
  getServiceWithFollowUpByName: (name: string) => ServiceWithFollowUp | undefined;
}

// Create the context
const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// Create the provider component
export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { supabase } = useSupabase();

  const [dentalServices, setDentalServices] = useState<Service[]>([]);
  const [meditouchServices, setMeditouchServices] = useState<Service[]>([]);
  const [servicesWithFollowUp, setServicesWithFollowUp] = useState<ServiceWithFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      setIsLoading(true);
      try {
        // Fetch services from Supabase
        const fetchedServices = await supabase
          .from('services')
          .getAll();

        // Split services by clinic type
        const dental = fetchedServices.filter((s: Service) => s.clinic_type === 'dental');
        const meditouch = fetchedServices.filter((s: Service) => s.clinic_type === 'meditouch');

        // Check if we need to add a default Dental Checkup service
        if (dental.length === 0 || !dental.some(s => s.name.toLowerCase() === 'dental checkup')) {
          console.log('No Dental Checkup service found, adding default...');

          // Add default Dental Checkup service
          const defaultService = {
            name: 'Dental Checkup',
            duration: 30,
            price: 500,
            description: 'Regular dental checkup and cleaning',
            clinic_type: 'dental' as const
          };

          try {
            const newService = await addService(defaultService);
            console.log('Default Dental Checkup service added:', newService);

            // Add to dental services
            dental.push(newService);
          } catch (error) {
            console.error('Error adding default Dental Checkup service:', error);
          }
        }

        setDentalServices(dental);
        setMeditouchServices(meditouch);

        // Fetch services with follow-up from Supabase
        const fetchedServicesWithFollowUp = await supabase
          .from('services_with_follow_up')
          .getAll();

        console.log(`Fetched ${fetchedServicesWithFollowUp?.length || 0} services with follow-up:`,
          fetchedServicesWithFollowUp?.map(s => ({
            name: s.name,
            requires_follow_up: s.requires_follow_up,
            interval_days: s.default_follow_up_interval_days,
            follow_up_service: s.follow_up_service_name
          }))
        );

        // Check if we need to add a default service with follow-up for Dental Checkup
        if (fetchedServicesWithFollowUp.length === 0 ||
            !fetchedServicesWithFollowUp.some(s => s.name.toLowerCase() === 'dental checkup')) {
          console.log('No service with follow-up found for Dental Checkup, adding default...');

          // Add default service with follow-up for Dental Checkup
          const defaultServiceWithFollowUp = {
            name: 'Dental Checkup',
            duration: 30,
            price: 500,
            description: 'Regular dental checkup and cleaning',
            requires_follow_up: true,
            default_follow_up_interval_days: 180, // 6 months
            number_of_follow_ups: 1,
            follow_up_service_name: 'Dental Checkup'
          };

          try {
            const newServiceWithFollowUp = await addServiceWithFollowUp(defaultServiceWithFollowUp);
            console.log('Default service with follow-up added for Dental Checkup:', newServiceWithFollowUp);

            // Add to services with follow-up
            fetchedServicesWithFollowUp.push(newServiceWithFollowUp);
          } catch (error) {
            console.error('Error adding default service with follow-up for Dental Checkup:', error);
          }
        }

        setServicesWithFollowUp(fetchedServicesWithFollowUp || []);
      } catch (error) {
        console.error('Error initializing services:', error);
        toast({
          title: 'Error',
          description: 'Failed to load services. Please try again later.',
          variant: 'destructive',
        });

        // Use empty arrays as fallback
        setDentalServices([]);
        setMeditouchServices([]);
        setServicesWithFollowUp([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, toast]);

  // Add a new service
  const addService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> => {
    try {
      // Add service to Supabase
      const data = await supabase
        .from('services')
        .insert(service);

      if (!data) throw new Error('Failed to create service');

      // Ensure we have a properly formatted service object
      // The response from Supabase might be an array or a single object
      let newService: Service;

      if (Array.isArray(data)) {
        // If it's an array, take the first item
        newService = data[0] as Service;
      } else {
        // Otherwise, use it directly
        newService = data as Service;
      }

      // Log the new service for debugging
      console.log('New service created:', newService);

      // Update local state based on clinic type
      if (service.clinic_type === 'dental') {
        setDentalServices(prev => [...prev, newService]);
      } else {
        setMeditouchServices(prev => [...prev, newService]);
      }

      toast({
        title: 'Success',
        description: `${service.name} has been added to ${service.clinic_type} services.`,
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
  const updateService = async (id: string, updates: Partial<Service>): Promise<Service> => {
    try {
      // Get the current service to determine its clinic type
      const currentService = [...dentalServices, ...meditouchServices].find(s => s.id === id);
      if (!currentService) throw new Error('Service not found');

      // Update service in Supabase
      const data = await supabase
        .from('services')
        .update(id, updates);

      if (!data) throw new Error('Failed to update service');

      // Ensure we have a properly formatted service object
      // The response from Supabase might be an array or a single object
      let updatedService: Service;

      if (Array.isArray(data)) {
        // If it's an array, take the first item
        updatedService = data[0] as Service;
      } else {
        // Otherwise, use it directly
        updatedService = data as Service;
      }

      // Make sure we preserve the clinic_type from the original service
      // in case it wasn't included in the updates
      updatedService.clinic_type = updatedService.clinic_type || currentService.clinic_type;

      // Log the updated service for debugging
      console.log('Service updated:', updatedService);

      // Update local state based on clinic type
      if (currentService.clinic_type === 'dental') {
        setDentalServices(prev => prev.map(s => s.id === id ? updatedService : s));
      } else {
        setMeditouchServices(prev => prev.map(s => s.id === id ? updatedService : s));
      }

      toast({
        title: 'Success',
        description: 'Service has been updated.',
      });

      return updatedService;
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
  const deleteService = async (id: string): Promise<void> => {
    try {
      // Get the current service to determine its clinic type
      const currentService = [...dentalServices, ...meditouchServices].find(s => s.id === id);
      if (!currentService) throw new Error('Service not found');

      console.log(`Attempting to delete service with ID: ${id}`);

      // Delete service from Supabase
      await supabase
        .from('services')
        .delete(id);

      console.log(`Service with ID: ${id} deleted successfully from Supabase`);

      // Update local state based on clinic type
      if (currentService.clinic_type === 'dental') {
        setDentalServices(prev => prev.filter(s => s.id !== id));
        console.log(`Removed service from dental services state`);
      } else {
        setMeditouchServices(prev => prev.filter(s => s.id !== id));
        console.log(`Removed service from meditouch services state`);
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

  // Add a new service with follow-up
  const addServiceWithFollowUp = async (service: Omit<ServiceWithFollowUp, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceWithFollowUp> => {
    try {
      // Add service with follow-up to Supabase
      const data = await supabase
        .from('services_with_follow_up')
        .insert(service);

      if (!data) throw new Error('Failed to create service with follow-up');

      // Ensure we have a properly formatted service object
      // The response from Supabase might be an array or a single object
      let newService: ServiceWithFollowUp;

      if (Array.isArray(data)) {
        // If it's an array, take the first item
        newService = data[0] as ServiceWithFollowUp;
      } else {
        // Otherwise, use it directly
        newService = data as ServiceWithFollowUp;
      }

      // Log the new service for debugging
      console.log('New service with follow-up created:', newService);

      // Update local state
      setServicesWithFollowUp(prev => [...prev, newService]);

      toast({
        title: 'Success',
        description: `${service.name} has been added to services with follow-up.`,
      });

      return newService;
    } catch (error) {
      console.error('Error adding service with follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to add service with follow-up. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a service with follow-up
  const updateServiceWithFollowUp = async (id: string, updates: Partial<ServiceWithFollowUp>): Promise<ServiceWithFollowUp> => {
    try {
      // Update service with follow-up in Supabase
      const data = await supabase
        .from('services_with_follow_up')
        .update(id, updates);

      if (!data) throw new Error('Failed to update service with follow-up');

      // Ensure we have a properly formatted service object
      // The response from Supabase might be an array or a single object
      let updatedService: ServiceWithFollowUp;

      if (Array.isArray(data)) {
        // If it's an array, take the first item
        updatedService = data[0] as ServiceWithFollowUp;
      } else {
        // Otherwise, use it directly
        updatedService = data as ServiceWithFollowUp;
      }

      // Log the updated service for debugging
      console.log('Service with follow-up updated:', updatedService);

      // Update local state
      setServicesWithFollowUp(prev => prev.map(s => s.id === id ? updatedService : s));

      toast({
        title: 'Success',
        description: 'Service with follow-up has been updated.',
      });

      return updatedService;
    } catch (error) {
      console.error('Error updating service with follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service with follow-up. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a service with follow-up
  const deleteServiceWithFollowUp = async (id: string): Promise<void> => {
    try {
      console.log(`Attempting to delete service with follow-up with ID: ${id}`);

      // Delete service with follow-up from Supabase
      await supabase
        .from('services_with_follow_up')
        .delete(id);

      console.log(`Service with follow-up with ID: ${id} deleted successfully from Supabase`);

      // Update local state
      setServicesWithFollowUp(prev => prev.filter(s => s.id !== id));
      console.log(`Removed service with follow-up from local state`);

      toast({
        title: 'Success',
        description: 'Service with follow-up has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting service with follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service with follow-up. Please try again.',
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

  // Get a service by name and clinic type
  const getServiceByName = (name: string, clinicType: 'dental' | 'meditouch'): Service | undefined => {
    const services = clinicType === 'dental' ? dentalServices : meditouchServices;
    return services.find(service => service.name === name);
  };

  // Get a service with follow-up by name
  const getServiceWithFollowUpByName = (name: string): ServiceWithFollowUp | undefined => {
    return servicesWithFollowUp.find(service => service.name === name);
  };

  return (
    <ServiceContext.Provider
      value={{
        dentalServices,
        meditouchServices,
        servicesWithFollowUp,
        isLoading,
        addService,
        updateService,
        deleteService,
        addServiceWithFollowUp,
        updateServiceWithFollowUp,
        deleteServiceWithFollowUp,
        getDentalServiceNames,
        getMeditouchServiceNames,
        getServiceByName,
        getServiceWithFollowUpByName
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
