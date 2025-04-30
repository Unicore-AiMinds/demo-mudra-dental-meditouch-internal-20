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

  // Helper function to determine tooth type for styling based on FDI notation
  const getToothType = (toothNumber: string) => {
    if (!toothNumber || toothNumber.length !== 2) return 'molar';

    // Extract the second digit which indicates the tooth position within the quadrant
    const position = parseInt(toothNumber.charAt(1));

    // Incisors: positions 1-2 in any quadrant
    if (position === 1 || position === 2) {
      return 'incisor';
    }

    // Canines: position 3 in any quadrant
    if (position === 3) {
      return 'canine';
    }

    // Premolars: positions 4-5 in any quadrant
    if (position === 4 || position === 5) {
      return 'premolar';
    }

    // Molars: positions 6-8 in any quadrant
    return 'molar';
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex justify-between mb-2">
        <div className="text-sm font-medium">QUADRANT 1 (Upper Right)</div>
        <div className="text-sm font-medium">QUADRANT 2 (Upper Left)</div>
      </div>

      {/* Upper teeth row */}
      <div className="flex justify-center mb-6">
        {upperTeeth.map((tooth, index) => (
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
                // Add a subtle divider between quadrants
                index === 7 && "border-r-2 border-r-dental-100",
                index === 8 && "border-l-2 border-l-dental-100",
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

      <div className="flex justify-between mb-2">
        <div className="text-sm font-medium">QUADRANT 3 (Lower Left)</div>
        <div className="text-sm font-medium">QUADRANT 4 (Lower Right)</div>
      </div>

      {/* Lower teeth row */}
      <div className="flex justify-center">
        {lowerTeeth.map((tooth, index) => (
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
                // Add a subtle divider between quadrants
                index === 7 && "border-r-2 border-r-dental-100",
                index === 8 && "border-l-2 border-l-dental-100",
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
        Using FDI/ISO 3950 notation (Quadrant-Position)
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Click on teeth to select/deselect them
      </div>
    </div>
  );
};

export default VisualToothChart;
