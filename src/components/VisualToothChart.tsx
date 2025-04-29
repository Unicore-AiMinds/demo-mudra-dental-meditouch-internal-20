import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface VisualToothChartProps {
  selectedTeeth: string[];
  onToothSelect: (toothNumber: string) => void;
}

const VisualToothChart: React.FC<VisualToothChartProps> = ({
  selectedTeeth,
  onToothSelect,
}) => {
  // Define the tooth layout for the chart using standard dental numbering
  // Upper teeth (1-16) from right to left
  const upperTeeth = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
  // Lower teeth (17-32) from left to right
  const lowerTeeth = ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'];

  // Helper function to determine tooth type for styling
  const getToothType = (toothNumber: string) => {
    const num = parseInt(toothNumber);

    // Incisors: 8-9, 7-10, 23-26, 24-25
    if ((num >= 7 && num <= 10) || (num >= 23 && num <= 26)) {
      return 'incisor';
    }

    // Canines: 6, 11, 22, 27
    if (num === 6 || num === 11 || num === 22 || num === 27) {
      return 'canine';
    }

    // Premolars: 4-5, 12-13, 20-21, 28-29
    if ((num >= 4 && num <= 5) || (num >= 12 && num <= 13) ||
        (num >= 20 && num <= 21) || (num >= 28 && num <= 29)) {
      return 'premolar';
    }

    // Molars: 1-3, 14-16, 17-19, 30-32
    return 'molar';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-4 text-sm font-medium">UPPER</div>

      {/* Upper teeth row - displayed from right to left (1-16) */}
      <div className="flex justify-center mb-6">
        {upperTeeth.map((tooth) => (
          <div
            key={`upper-${tooth}`}
            className="relative"
          >
            <button
              type="button"
              onClick={() => onToothSelect(tooth)}
              className={cn(
                "w-10 h-14 m-0.5 border rounded-md flex items-center justify-center transition-colors text-sm",
                getToothType(tooth) === 'incisor' && "rounded-b-xl",
                getToothType(tooth) === 'canine' && "rounded-b-xl h-16",
                getToothType(tooth) === 'premolar' && "rounded-md",
                getToothType(tooth) === 'molar' && "rounded-md w-11",
                selectedTeeth.includes(tooth)
                  ? "bg-dental-primary text-white border-dental-primary"
                  : "bg-white hover:bg-dental-50 border-gray-300"
              )}
            >
              {tooth}
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-300 my-6"></div>

      <div className="text-center mt-4 mb-4 text-sm font-medium">LOWER</div>

      {/* Lower teeth row - displayed from left to right (17-32) */}
      <div className="flex justify-center">
        {lowerTeeth.map((tooth) => (
          <div
            key={`lower-${tooth}`}
            className="relative"
          >
            <button
              type="button"
              onClick={() => onToothSelect(tooth)}
              className={cn(
                "w-10 h-14 m-0.5 border rounded-md flex items-center justify-center transition-colors text-sm",
                getToothType(tooth) === 'incisor' && "rounded-t-xl",
                getToothType(tooth) === 'canine' && "rounded-t-xl h-16",
                getToothType(tooth) === 'premolar' && "rounded-md",
                getToothType(tooth) === 'molar' && "rounded-md w-11",
                selectedTeeth.includes(tooth)
                  ? "bg-dental-primary text-white border-dental-primary"
                  : "bg-white hover:bg-dental-50 border-gray-300"
              )}
            >
              {tooth}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Click on teeth to select/deselect them
      </div>
    </div>
  );
};

export default VisualToothChart;
