import React, { createContext, useContext, useState, useEffect } from 'react';
import { Medicine, initialMedicines } from '@/types/medicines';

// Define the context type
interface MedicineContextType {
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Medicine;
  updateMedicine: (id: number, updates: Partial<Omit<Medicine, 'id'>>) => Medicine | null;
  deleteMedicine: (id: number) => boolean;
}

// Create the context
const MedicineContext = createContext<MedicineContextType | undefined>(undefined);

// Provider component
export const MedicineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medicines, setMedicines] = useState<Medicine[]>(initialMedicines);

  // Add a new medicine
  const addMedicine = (medicine: Omit<Medicine, 'id'>): Medicine => {
    const newId = medicines.length > 0 
      ? Math.max(...medicines.map(m => m.id)) + 1 
      : 1;
    
    const newMedicine: Medicine = {
      id: newId,
      ...medicine
    };

    setMedicines(prev => [...prev, newMedicine]);
    return newMedicine;
  };

  // Update an existing medicine
  const updateMedicine = (id: number, updates: Partial<Omit<Medicine, 'id'>>): Medicine | null => {
    let updatedMedicine: Medicine | null = null;

    setMedicines(prev => {
      const index = prev.findIndex(medicine => medicine.id === id);
      
      if (index === -1) return prev;
      
      updatedMedicine = {
        ...prev[index],
        ...updates
      };
      
      return [
        ...prev.slice(0, index),
        updatedMedicine,
        ...prev.slice(index + 1)
      ];
    });

    return updatedMedicine;
  };

  // Delete a medicine
  const deleteMedicine = (id: number): boolean => {
    let success = false;

    setMedicines(prev => {
      const index = prev.findIndex(medicine => medicine.id === id);
      
      if (index === -1) return prev;
      
      success = true;
      return [
        ...prev.slice(0, index),
        ...prev.slice(index + 1)
      ];
    });

    return success;
  };

  // Save medicines to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dentalMedicines', JSON.stringify(medicines));
  }, [medicines]);

  // Load medicines from localStorage on initial load
  useEffect(() => {
    const savedMedicines = localStorage.getItem('dentalMedicines');
    if (savedMedicines) {
      try {
        setMedicines(JSON.parse(savedMedicines));
      } catch (error) {
        console.error('Error parsing saved medicines:', error);
      }
    }
  }, []);

  return (
    <MedicineContext.Provider value={{ 
      medicines, 
      setMedicines, 
      addMedicine, 
      updateMedicine, 
      deleteMedicine 
    }}>
      {children}
    </MedicineContext.Provider>
  );
};

// Custom hook to use the medicine context
export const useMedicines = () => {
  const context = useContext(MedicineContext);
  if (context === undefined) {
    throw new Error('useMedicines must be used within a MedicineProvider');
  }
  return context;
};
