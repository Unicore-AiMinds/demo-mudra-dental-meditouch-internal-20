import React from 'react';
import { useClinicInfo } from '@/contexts/ClinicInfoContext';

interface ClinicAddressDisplayProps {
  showEmail?: boolean;
  showHours?: boolean;
  className?: string;
}

const ClinicAddressDisplay: React.FC<ClinicAddressDisplayProps> = ({ 
  showEmail = false, 
  showHours = false,
  className = ""
}) => {
  const { currentClinicInfo, getFullAddress } = useClinicInfo();
  
  return (
    <div className={`clinic-address ${className}`}>
      <h3 className="font-bold">{currentClinicInfo.name}</h3>
      <p>{getFullAddress()}</p>
      <p>Phone: {currentClinicInfo.phone}</p>
      {showEmail && <p>Email: {currentClinicInfo.email}</p>}
      
      {showHours && (
        <div className="mt-2">
          <h4 className="font-semibold">Hours:</h4>
          <ul className="text-sm">
            <li>Monday: {currentClinicInfo.operatingHours.monday}</li>
            <li>Tuesday: {currentClinicInfo.operatingHours.tuesday}</li>
            <li>Wednesday: {currentClinicInfo.operatingHours.wednesday}</li>
            <li>Thursday: {currentClinicInfo.operatingHours.thursday}</li>
            <li>Friday: {currentClinicInfo.operatingHours.friday}</li>
            <li>Saturday: {currentClinicInfo.operatingHours.saturday}</li>
            <li>Sunday: {currentClinicInfo.operatingHours.sunday}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClinicAddressDisplay;
