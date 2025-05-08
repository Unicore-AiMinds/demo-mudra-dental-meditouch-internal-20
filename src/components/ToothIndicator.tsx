import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { permanentTeethList, primaryTeethList } from '@/types/dental-charting';

interface ToothIndicatorProps {
  toothNumbers: string[] | string[]; // Accept both field names
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ToothIndicator: React.FC<ToothIndicatorProps> = ({
  toothNumbers,
  size = 'sm',
  className
}) => {
  // State to determine if we should show primary teeth
  const [showPrimaryTeeth, setShowPrimaryTeeth] = useState(false);

  // Check if any of the selected teeth are primary teeth
  useEffect(() => {
    // If any of the selected teeth are in the primary teeth list, show primary teeth
    const hasPrimaryTeeth = toothNumbers.some(tooth =>
      primaryTeethList.includes(tooth)
    );

    if (hasPrimaryTeeth) {
      setShowPrimaryTeeth(true);
    } else {
      // Check if any of the selected teeth are in the permanent teeth list
      const hasPermanentTeeth = toothNumbers.some(tooth =>
        permanentTeethList.includes(tooth)
      );

      // Only switch to permanent teeth if there are permanent teeth selected
      if (hasPermanentTeeth) {
        setShowPrimaryTeeth(false);
      }
    }
  }, [toothNumbers]);

  // Define the permanent teeth layout for the chart using FDI/ISO 3950 notation
  // Upper permanent teeth: Quadrant 1 (Upper Right) and Quadrant 2 (Upper Left)
  const upperPermanentTeeth = [
    // Quadrant 1 (Upper Right) - from back to front
    '18', '17', '16', '15', '14', '13', '12', '11',
    // Quadrant 2 (Upper Left) - from front to back
    '21', '22', '23', '24', '25', '26', '27', '28'
  ];

  // Lower permanent teeth: Quadrant 4 (Lower Right) and Quadrant 3 (Lower Left)
  // Rearranged to match upper quadrants (lower right under upper right, lower left under upper left)
  const lowerPermanentTeeth = [
    // Quadrant 4 (Lower Right) - from back to front
    '48', '47', '46', '45', '44', '43', '42', '41',
    // Quadrant 3 (Lower Left) - from front to back
    '31', '32', '33', '34', '35', '36', '37', '38'
  ];

  // Define the primary teeth layout for the chart using FDI/ISO 3950 notation
  // Upper primary teeth: Quadrant 5 (Upper Right) and Quadrant 6 (Upper Left)
  const upperPrimaryTeeth = [
    // Quadrant 5 (Upper Right) - from back to front
    '55', '54', '53', '52', '51',
    // Quadrant 6 (Upper Left) - from front to back
    '61', '62', '63', '64', '65'
  ];

  // Lower primary teeth: Quadrant 8 (Lower Right) and Quadrant 7 (Lower Left)
  // Rearranged to match upper quadrants (lower right under upper right, lower left under upper left)
  const lowerPrimaryTeeth = [
    // Quadrant 8 (Lower Right) - from back to front
    '85', '84', '83', '82', '81',
    // Quadrant 7 (Lower Left) - from front to back
    '71', '72', '73', '74', '75'
  ];

  // Use the appropriate teeth arrays based on the current mode
  const upperTeeth = showPrimaryTeeth ? upperPrimaryTeeth : upperPermanentTeeth;
  const lowerTeeth = showPrimaryTeeth ? lowerPrimaryTeeth : lowerPermanentTeeth;

  // Size classes
  const sizeClasses = {
    sm: 'w-3 h-3 text-[6px]',
    md: 'w-4 h-4 text-[8px]',
    lg: 'w-5 h-5 text-[10px]'
  };

  return (
    <div className={cn("grid grid-cols-2 gap-1", className)}>
      {/* Upper Right Quadrant */}
      <div className="flex justify-end">
        {upperTeeth.slice(0, showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
          <div
            key={`upper-right-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              // Add a subtle divider between quadrants
              index === (showPrimaryTeeth ? 4 : 7) && "border-r-[1px] border-r-dental-300",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth} (${showPrimaryTeeth ? 'Primary ' : ''}Upper Right)`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>

      {/* Upper Left Quadrant */}
      <div className="flex justify-start">
        {upperTeeth.slice(showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
          <div
            key={`upper-left-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              // Add a subtle divider between quadrants
              index === 0 && "border-l-[1px] border-l-dental-300",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth} (${showPrimaryTeeth ? 'Primary ' : ''}Upper Left)`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>

      {/* Lower Right Quadrant */}
      <div className="flex justify-end">
        {lowerTeeth.slice(0, showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
          <div
            key={`lower-right-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              // Add a subtle divider between quadrants
              index === (showPrimaryTeeth ? 4 : 7) && "border-r-[1px] border-r-dental-300",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth} (${showPrimaryTeeth ? 'Primary ' : ''}Lower Right)`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>

      {/* Lower Left Quadrant */}
      <div className="flex justify-start">
        {lowerTeeth.slice(showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
          <div
            key={`lower-left-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              // Add a subtle divider between quadrants
              index === 0 && "border-l-[1px] border-l-dental-300",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth} (${showPrimaryTeeth ? 'Primary ' : ''}Lower Left)`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToothIndicator;
