import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRandomDentalColor } from '@/utils/doctorColors';

// Define the Doctor type
export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  aadharDoc?: string;
  panDoc?: string;
  color: string;
}

// Define the context type
interface DoctorContextType {
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  updateDoctorColor: (doctorId: number, newColor: string) => void;
  getDoctorByName: (name: string) => Doctor | undefined;
}

// Create the context
const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

// Initial doctors data
const initialDoctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Rajan Khanna",
    specialization: "General Dentistry",
    email: "rajan.khanna@dentalmetrix.com",
    phone: "+91 98765 43210",
    aadharDoc: "/docs/aadhar_rajan.pdf",
    panDoc: "/docs/pan_rajan.pdf",
    color: "#4A90E2" // Sky blue
  },
  {
    id: 2,
    name: "Dr. Priya Desai",
    specialization: "Orthodontics",
    email: "priya.desai@dentalmetrix.com",
    phone: "+91 87654 32109",
    aadharDoc: "/docs/aadhar_priya.pdf",
    panDoc: "",
    color: "#2ECC71" // Emerald green
  },
  {
    id: 3,
    name: "Dr. Vikram Mehta",
    specialization: "Endodontics",
    email: "vikram.mehta@dentalmetrix.com",
    phone: "+91 76543 21098",
    aadharDoc: "",
    panDoc: "/docs/pan_vikram.pdf",
    color: "#9B59B6" // Amethyst
  },
  {
    id: 4,
    name: "Dr. Ananya Sharma",
    specialization: "Pediatric Dentistry",
    email: "ananya.sharma@dentalmetrix.com",
    phone: "+91 65432 10987",
    aadharDoc: "/docs/aadhar_ananya.pdf",
    panDoc: "/docs/pan_ananya.pdf",
    color: "#E74C3C" // Alizarin
  }
];

// Provider component
export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);

  // Function to update a doctor's color
  const updateDoctorColor = (doctorId: number, newColor: string) => {
    setDoctors(prevDoctors => 
      prevDoctors.map(doctor => 
        doctor.id === doctorId 
          ? { ...doctor, color: newColor } 
          : doctor
      )
    );
  };

  // Function to get a doctor by name
  const getDoctorByName = (name: string) => {
    return doctors.find(doctor => doctor.name === name);
  };

  // Save doctors to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dentalDoctors', JSON.stringify(doctors));
  }, [doctors]);

  // Load doctors from localStorage on initial load
  useEffect(() => {
    const savedDoctors = localStorage.getItem('dentalDoctors');
    if (savedDoctors) {
      try {
        setDoctors(JSON.parse(savedDoctors));
      } catch (error) {
        console.error('Error parsing saved doctors:', error);
      }
    }
  }, []);

  return (
    <DoctorContext.Provider value={{ doctors, setDoctors, updateDoctorColor, getDoctorByName }}>
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
