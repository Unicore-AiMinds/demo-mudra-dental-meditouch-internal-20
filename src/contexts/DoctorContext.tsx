import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRandomDentalColor } from '@/utils/doctorColors';
import { useToast } from '@/components/ui/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { AuditLogTemplates } from '@/utils/auditLogger';
import { uploadFile, deleteFile, checkStorageAccess } from '@/lib/supabase-storage';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client
const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define the Doctor type
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  aadhar_doc?: string;
  pan_doc?: string;
  color: string;
  clinic_type?: 'dental' | 'meditouch' | 'both';
}

// Define the context type
interface DoctorContextType {
  doctors: Doctor[]; // Filtered doctors based on current clinic
  allDoctors: Doctor[]; // All doctors regardless of clinic
  isLoading: boolean;
  refreshDoctors: () => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id'>, aadharFile?: File, panFile?: File) => Promise<Doctor>;
  updateDoctor: (id: string, doctor: Partial<Doctor>, aadharFile?: File, panFile?: File) => Promise<Doctor>;
  deleteDoctor: (id: string) => Promise<void>;
  updateDoctorColor: (doctorId: string, newColor: string) => Promise<void>;
  getDoctorByName: (name: string) => Doctor | undefined;
}

// Create the context
const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// Default doctors data (used for initialization if no doctors exist)
const defaultDoctors = [
  {
    name: "Dr. Rajan Khanna",
    specialization: "General Dentistry",
    email: "rajan.khanna@mudraclinic.com",
    phone: "+91 98765 43210",
    color: "#4A90E2" // Sky blue
  },
  {
    name: "Dr. Priya Desai",
    specialization: "Orthodontics",
    email: "priya.desai@mudraclinic.com",
    phone: "+91 87654 32109",
    color: "#2ECC71" // Emerald green
  },
  {
    name: "Dr. Vikram Mehta",
    specialization: "Endodontics",
    email: "vikram.mehta@mudraclinic.com",
    phone: "+91 76543 21098",
    color: "#9B59B6" // Amethyst
  }
];

// Provider component
export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { activeClinic } = useClinic();
  const { logAction } = useAuditLog();

  // Filter doctors based on current clinic
  const doctors = React.useMemo(() => {
    if (activeClinic === 'dental' || activeClinic === 'meditouch') {
      return allDoctors.filter(doctor =>
        doctor.clinic_type === activeClinic ||
        doctor.clinic_type === 'both' ||
        doctor.clinic_type === undefined // Include legacy doctors without clinic_type
      );
    }
    return allDoctors; // Show all doctors if no specific clinic is selected
  }, [allDoctors, activeClinic]);

  // Function to refresh doctors from Supabase
  const refreshDoctors = async (): Promise<void> => {
      try {
        setIsLoading(true);
        console.log('Fetching doctors from Supabase using direct client...');

        // Use the direct Supabase client instead of the custom one
        const { data: fetchedDoctors, error } = await supabaseClient
          .from('doctors')
          .select('*');

        console.log('Direct Supabase client response:', { fetchedDoctors, error });

        // If we got an error, log more details
        if (error) {
          console.error('Supabase query error details:', error);
        } else {
          console.log('Fetched doctors count:', fetchedDoctors?.length || 0);
          console.log('First doctor (if any):', fetchedDoctors?.[0]);
        }

        if (error) {
          throw error;
        }

        // No automatic creation of default doctors
        if (!fetchedDoctors || fetchedDoctors.length === 0) {
          console.log('No doctors found in database.');
          setAllDoctors([]);
        } else {
          console.log('Setting doctors state with fetched doctors:', fetchedDoctors);
          setAllDoctors(fetchedDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load doctors. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize doctors on component mount
    useEffect(() => {
      refreshDoctors();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


  // Add a new doctor
  const addDoctor = async (doctor: Omit<Doctor, 'id'>, aadharFile?: File, panFile?: File): Promise<Doctor> => {
    try {
      // Check if storage is accessible
      const isStorageAccessible = await checkStorageAccess();
      if (!isStorageAccessible && (aadharFile || panFile)) {
        console.warn('Storage is not accessible. Document uploads will be skipped.');
        toast({
          title: 'Warning',
          description: 'Storage is not accessible. Document uploads will be skipped.',
          variant: 'destructive',
        });
      }

      // Generate a random color if not provided and add clinic type
      const doctorWithColor = {
        ...doctor,
        color: doctor.color || getRandomDentalColor(),
        clinic_type: doctor.clinic_type || activeClinic // Use current active clinic if not specified
      };

      console.log('Adding new doctor with data:', doctorWithColor);

      // Add doctor to Supabase first to get the ID
      const { data: newDoctorData, error: insertError } = await supabaseClient
        .from('doctors')
        .insert(doctorWithColor)
        .select();

      if (insertError) throw insertError;
      if (!newDoctorData || newDoctorData.length === 0) throw new Error('Failed to create doctor - no data returned');

      const newDoctor = newDoctorData[0] as Doctor;
      console.log('New doctor created:', newDoctor);

      // Upload Aadhar document if provided and storage is accessible
      if (aadharFile && isStorageAccessible) {
        const filePath = `${newDoctor.id}/aadhar_${Date.now()}.${aadharFile.name.split('.').pop()}`;
        const publicUrl = await uploadFile(aadharFile, filePath);

        if (publicUrl) {
          console.log('Aadhar document uploaded, URL:', publicUrl);

          // Update the doctor record with the file URL
          try {
            const { data: updatedDoctorData, error: updateError } = await supabaseClient
              .from('doctors')
              .update({ aadhar_doc: publicUrl })
              .eq('id', newDoctor.id)
              .select();

            if (updateError) throw updateError;

            if (updatedDoctorData && updatedDoctorData.length > 0) {
              // Update the local doctor object
              newDoctor.aadhar_doc = publicUrl;
              console.log('Doctor record updated with Aadhar document URL');
            }
          } catch (updateError) {
            console.error('Error updating doctor with Aadhar document URL:', updateError);
            toast({
              title: 'Warning',
              description: 'Aadhar document was uploaded but doctor record could not be updated.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Warning',
            description: 'Aadhar document upload failed.',
            variant: 'destructive',
          });
        }
      }

      // Upload PAN document if provided and storage is accessible
      if (panFile && isStorageAccessible) {
        const filePath = `${newDoctor.id}/pan_${Date.now()}.${panFile.name.split('.').pop()}`;
        const publicUrl = await uploadFile(panFile, filePath);

        if (publicUrl) {
          console.log('PAN document uploaded, URL:', publicUrl);

          // Update the doctor record with the file URL
          try {
            const { data: updatedDoctorData, error: updateError } = await supabaseClient
              .from('doctors')
              .update({ pan_doc: publicUrl })
              .eq('id', newDoctor.id)
              .select();

            if (updateError) throw updateError;

            if (updatedDoctorData && updatedDoctorData.length > 0) {
              // Update the local doctor object
              newDoctor.pan_doc = publicUrl;
              console.log('Doctor record updated with PAN document URL');
            }
          } catch (updateError) {
            console.error('Error updating doctor with PAN document URL:', updateError);
            toast({
              title: 'Warning',
              description: 'PAN document was uploaded but doctor record could not be updated.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Warning',
            description: 'PAN document upload failed.',
            variant: 'destructive',
          });
        }
      }

      // Fetch the updated doctor to ensure we have the latest data
      try {
        const { data: refreshedDoctors, error: refreshError } = await supabaseClient
          .from('doctors')
          .select('*')
          .eq('id', newDoctor.id);

        if (refreshError) throw refreshError;

        if (refreshedDoctors && refreshedDoctors.length > 0) {
          const refreshedDoctor = refreshedDoctors[0] as Doctor;
          console.log('Refreshed doctor data:', refreshedDoctor);

          // Update local state with the refreshed data
          setAllDoctors(prev => [...prev, refreshedDoctor]);

          toast({
            title: 'Success',
            description: `Doctor ${doctor.name} added successfully.`,
          });

          // Log the audit action with detailed information
          try {
            await logAction(AuditLogTemplates.doctor.create(
              refreshedDoctor.id,
              doctor.name,
              doctor.specialization,
              doctor.clinic
            ));
          } catch (auditError) {
            console.error('Failed to log doctor creation audit:', auditError);
          }

          return refreshedDoctor;
        }
      } catch (refreshError) {
        console.error('Error refreshing doctor data:', refreshError);
      }

      // If refresh failed, use the data we have
      setAllDoctors(prev => [...prev, newDoctor]);

      toast({
        title: 'Success',
        description: `Doctor ${doctor.name} added successfully.`,
      });

      // Log the audit action with detailed information
      try {
        await logAction(AuditLogTemplates.doctor.create(
          newDoctor.id,
          doctor.name,
          doctor.specialization,
          doctor.clinic
        ));
      } catch (auditError) {
        console.error('Failed to log doctor creation audit:', auditError);
      }

      // Refresh doctors to ensure we have the latest data
      setTimeout(() => {
        refreshDoctors();
      }, 500);

      return newDoctor;
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to add doctor. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a doctor
  const updateDoctor = async (id: string, doctor: Partial<Doctor>, aadharFile?: File, panFile?: File): Promise<Doctor> => {
    try {
      // Check if storage is accessible
      const isStorageAccessible = await checkStorageAccess();
      if (!isStorageAccessible && (aadharFile || panFile)) {
        console.warn('Storage is not accessible. Document uploads will be skipped.');
        toast({
          title: 'Warning',
          description: 'Storage is not accessible. Document uploads will be skipped.',
          variant: 'destructive',
        });
      }

      // Create a copy of the doctor data for updates
      const doctorUpdate = { ...doctor };

      // Upload Aadhar document if provided and storage is accessible
      if (aadharFile && isStorageAccessible) {
        const filePath = `${id}/aadhar_${Date.now()}.${aadharFile.name.split('.').pop()}`;
        const publicUrl = await uploadFile(aadharFile, filePath);

        if (publicUrl) {
          console.log('Aadhar document uploaded, URL:', publicUrl);
          // Add the file URL to the update data
          doctorUpdate.aadhar_doc = publicUrl;
        } else {
          toast({
            title: 'Warning',
            description: 'Aadhar document upload failed.',
            variant: 'destructive',
          });
        }
      }

      // Upload PAN document if provided and storage is accessible
      if (panFile && isStorageAccessible) {
        const filePath = `${id}/pan_${Date.now()}.${panFile.name.split('.').pop()}`;
        const publicUrl = await uploadFile(panFile, filePath);

        if (publicUrl) {
          console.log('PAN document uploaded, URL:', publicUrl);
          // Add the file URL to the update data
          doctorUpdate.pan_doc = publicUrl;
        } else {
          toast({
            title: 'Warning',
            description: 'PAN document upload failed.',
            variant: 'destructive',
          });
        }
      }

      console.log('Updating doctor with data:', doctorUpdate);

      // Update doctor in Supabase
      const { data: updatedDoctorData, error: updateError } = await supabaseClient
        .from('doctors')
        .update(doctorUpdate)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;
      if (!updatedDoctorData || updatedDoctorData.length === 0) throw new Error('Failed to update doctor - no data returned');

      const updatedDoctor = updatedDoctorData[0] as Doctor;
      console.log('Doctor updated successfully:', updatedDoctor);

      // Update local state
      setAllDoctors(prev => prev.map(d => d.id === id ? updatedDoctor : d));

      toast({
        title: 'Success',
        description: 'Doctor updated successfully.',
      });

      // Log the audit action
      try {
        const originalDoctor = allDoctors.find(d => d.id === id);
        await logAction(AuditLogTemplates.doctor.update(
          id,
          updatedDoctor.name,
          { before: originalDoctor, after: updatedDoctor }
        ));
      } catch (auditError) {
        console.error('Failed to log doctor update audit:', auditError);
      }

      // Refresh doctors to ensure we have the latest data
      setTimeout(() => {
        refreshDoctors();
      }, 500);

      return updatedDoctor;
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update doctor. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete a doctor
  const deleteDoctor = async (id: string): Promise<void> => {
    try {
      // Get the doctor to check for documents and for audit log
      const doctorToDelete = allDoctors.find(d => d.id === id);
      const doctorName = doctorToDelete?.name || 'Unknown Doctor';

      // Check if storage is accessible
      const isStorageAccessible = await checkStorageAccess();

      if (doctorToDelete && isStorageAccessible) {
        // Try to delete associated documents from storage if they exist
        try {
          // If the doctor has document URLs, try to delete them individually
          if (doctorToDelete.aadhar_doc || doctorToDelete.pan_doc) {
            console.log('Attempting to delete doctor documents from storage');

            // Extract the paths from the URLs
            const extractPathFromUrl = (url: string | undefined) => {
              if (!url) return null;
              try {
                // The URL format is like: https://cqtloiklvpvafeoiyyhy.supabase.co/storage/v1/object/public/doctor-documents/[path]
                const urlObj = new URL(url);
                const pathMatch = urlObj.pathname.match(/\/public\/doctor-documents\/(.+)$/);
                return pathMatch ? pathMatch[1] : null;
              } catch (e) {
                console.error('Error parsing document URL:', e);
                return null;
              }
            };

            const aadharPath = extractPathFromUrl(doctorToDelete.aadhar_doc);
            const panPath = extractPathFromUrl(doctorToDelete.pan_doc);

            // Delete individual files
            if (aadharPath) {
              await deleteFile(aadharPath);
              console.log('Aadhar document deleted from storage');
            }

            if (panPath) {
              await deleteFile(panPath);
              console.log('PAN document deleted from storage');
            }
          }
        } catch (storageError) {
          console.error('Error deleting doctor documents:', storageError);
          // Continue with doctor deletion even if document deletion fails
        }
      } else if (doctorToDelete && !isStorageAccessible) {
        console.warn('Storage is not accessible. Document deletion will be skipped.');
      }

      // Delete doctor from Supabase
      const { error: deleteError } = await supabaseClient
        .from('doctors')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      console.log('Doctor deleted from database successfully');

      // Update local state
      setAllDoctors(prev => prev.filter(d => d.id !== id));

      // Log the audit action with detailed information
      try {
        await logAction(AuditLogTemplates.doctor.delete(
          id,
          doctorName,
          doctorToDelete?.specialization
        ));
      } catch (auditError) {
        console.error('Failed to log doctor deletion audit:', auditError);
      }

      toast({
        title: 'Success',
        description: 'Doctor deleted successfully.',
      });

      // Refresh doctors to ensure we have the latest data
      setTimeout(() => {
        refreshDoctors();
      }, 500);
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete doctor. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update a doctor's color
  const updateDoctorColor = async (doctorId: string, newColor: string): Promise<void> => {
    try {
      console.log(`Updating doctor ${doctorId} color to ${newColor}`);

      // Update doctor color in Supabase
      const { data: updatedDoctorData, error } = await supabaseClient
        .from('doctors')
        .update({ color: newColor })
        .eq('id', doctorId)
        .select();

      if (error) throw error;

      console.log('Color update response:', updatedDoctorData);

      // Update local state
      setAllDoctors(prevDoctors =>
        prevDoctors.map(doctor =>
          doctor.id === doctorId
            ? { ...doctor, color: newColor }
            : doctor
        )
      );

      toast({
        title: 'Success',
        description: 'Doctor color updated successfully.',
      });
    } catch (error) {
      console.error('Error updating doctor color:', error);
      toast({
        title: 'Error',
        description: 'Failed to update doctor color. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Function to get a doctor by name
  const getDoctorByName = (name: string) => {
    return doctors.find(doctor => doctor.name === name);
  };

  // Debug log the current doctors state
  console.log('DoctorContext current doctors state:', doctors);

  return (
    <DoctorContext.Provider value={{
      doctors,
      allDoctors,
      isLoading,
      refreshDoctors,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      updateDoctorColor,
      getDoctorByName
    }}>
      {children}
    </DoctorContext.Provider>
  );
};

// Custom hook to use the doctor context
export const useDoctors = () => {
  const context = useContext(DoctorContext);
  if (context === undefined) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
};
