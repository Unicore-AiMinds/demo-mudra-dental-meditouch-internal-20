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
  // Define the tooth layout for the chart using standard dental numbering
  // Upper teeth (1-16) from right to left
  const upperTeeth = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
  // Lower teeth (17-32) from left to right
  const lowerTeeth = ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'];

  // Size classes
  const sizeClasses = {
    sm: 'w-3 h-3 text-[6px]',
    md: 'w-4 h-4 text-[8px]',
    lg: 'w-5 h-5 text-[10px]'
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Upper teeth row - displayed from right to left (1-16) */}
      <div className="flex justify-center">
        {upperTeeth.map((tooth) => (
          <div
            key={`upper-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth}`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>

      {/* Lower teeth row - displayed from left to right (17-32) */}
      <div className="flex justify-center">
        {lowerTeeth.map((tooth) => (
          <div
            key={`lower-${tooth}`}
            className={cn(
              sizeClasses[size],
              "border rounded-sm flex items-center justify-center",
              toothNumbers.includes(tooth)
                ? "bg-dental-primary text-white border-dental-primary"
                : "bg-gray-100 text-gray-400 border-gray-200"
            )}
            title={`Tooth ${tooth}`}
          >
            {size !== 'sm' && tooth}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToothIndicator;
