import React from 'react';
import { cn } from '@/lib/utils';

interface ToothIndicatorProps {
  toothNumbers: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ToothIndicator: React.FC<ToothIndicatorProps> = ({
  toothNumbers,
  size = 'sm',
  className
}) => {
  // Define the tooth layout for the chart using FDI/ISO 3950 notation
  // Upper teeth: Quadrant 1 (Upper Right) and Quadrant 2 (Upper Left)
  const upperTeeth = [
    // Quadrant 1 (Upper Right) - from back to front
    '18', '17', '16', '15', '14', '13', '12', '11',
    // Quadrant 2 (Upper Left) - from front to back
    '21', '22', '23', '24', '25', '26', '27', '28'
  ];

  // Lower teeth: Quadrant 3 (Lower Left) and Quadrant 4 (Lower Right)
  const lowerTeeth = [
    // Quadrant 3 (Lower Left) - from front to back
    '31', '32', '33', '34', '35', '36', '37', '38',
    // Quadrant 4 (Lower Right) - from back to front
    '48', '47', '46', '45', '44', '43', '42', '41'
  ];

  // Size classes
  const sizeClasses = {
    sm: 'w-3 h-3 text-[6px]',
    md: 'w-4 h-4 text-[8px]',
    lg: 'w-5 h-5 text-[10px]'
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Upper teeth row */}
      <div className="flex justify-center">
        {upperTeeth.map((tooth, index) => (
          <div
            key={`upper-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              // Add a subtle divider between quadrants
              index === 7 && "border-r-[1px] border-r-dental-300",
              index === 8 && "border-l-[1px] border-l-dental-300",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth} (${tooth.charAt(0) === '1' ? 'Upper Right' : 'Upper Left'})`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>

      {/* Lower teeth row */}
      <div className="flex justify-center">
        {lowerTeeth.map((tooth, index) => (
          <div
            key={`lower-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              // Add a subtle divider between quadrants
              index === 7 && "border-r-[1px] border-r-dental-300",
              index === 8 && "border-l-[1px] border-l-dental-300",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth} (${tooth.charAt(0) === '3' ? 'Lower Left' : 'Lower Right'})`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToothIndicator;
