import React from 'react';
import { usePatients } from '@/contexts/PatientContext';
import { useClinic } from '@/contexts/ClinicContext';

const PatientsAnalytics: React.FC = () => {
  const { patients } = usePatients();
  const { isDental } = useClinic();

  // Filter patients for current clinic
  const currentClinicPatients = patients.filter(p => 
    isDental ? (p.clinic === 'dental' || p.clinic === 'both') : (p.clinic === 'meditouch' || p.clinic === 'both')
  );

  // Calculate new patients this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const newPatientsThisMonth = currentClinicPatients.filter(patient => {
    if (!patient.created_at) return false;
    const createdDate = new Date(patient.created_at);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;

  // Create analytical message
  const getAnalyticalMessage = () => {
    if (newPatientsThisMonth > 0) {
      return `+${newPatientsThisMonth} new this month`;
    }
    
    if (currentClinicPatients.length === 0) {
      return "No patients registered yet";
    }
    
    return "No new patients this month";
  };

  return <>{getAnalyticalMessage()}</>;
};

export default PatientsAnalytics;
