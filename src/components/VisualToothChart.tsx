import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface VisualToothChartProps {
  selectedTeeth: string[];
  onToothSelect: (toothNumber: string) => void;
}

const VisualToothChart: React.FC<VisualToothChartProps> = ({
  selectedTeeth,
  onToothSelect,
}) => {
  // State to toggle between permanent and primary teeth
  const [showPrimaryTeeth, setShowPrimaryTeeth] = useState(false);

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
      {/* Toggle between permanent and primary teeth */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={!showPrimaryTeeth ? "default" : "outline"}
            onClick={() => setShowPrimaryTeeth(false)}
            className="text-sm"
          >
            Full Mouth (Permanent Teeth)
          </Button>
          <Button
            variant={showPrimaryTeeth ? "default" : "outline"}
            onClick={() => setShowPrimaryTeeth(true)}
            className="text-sm"
          >
            Show Child Teeth (Primary)
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="teeth-toggle"
            checked={showPrimaryTeeth}
            onCheckedChange={setShowPrimaryTeeth}
          />
          <Label htmlFor="teeth-toggle" className="text-sm">
            {showPrimaryTeeth ? "Primary Teeth" : "Permanent Teeth"}
          </Label>
        </div>
      </div>

      {/* Dental chart with quadrants arranged in a grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Upper Right Quadrant */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-center">
            {showPrimaryTeeth ? "QUADRANT 5 (Upper Right)" : "QUADRANT 1 (Upper Right)"}
          </div>
          <div className="flex justify-end">
            {upperTeeth.slice(0, showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
              <div
                key={`upper-right-${tooth}`}
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
                    index === (showPrimaryTeeth ? 4 : 7) && "border-r-2 border-r-dental-100",
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
        </div>

        {/* Upper Left Quadrant */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-center">
            {showPrimaryTeeth ? "QUADRANT 6 (Upper Left)" : "QUADRANT 2 (Upper Left)"}
          </div>
          <div className="flex justify-start">
            {upperTeeth.slice(showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
              <div
                key={`upper-left-${tooth}`}
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
                    index === 0 && "border-l-2 border-l-dental-100",
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
        </div>

        {/* Lower Right Quadrant */}
        <div className="space-y-2">
          <div className="flex justify-end">
            {lowerTeeth.slice(0, showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
              <div
                key={`lower-right-${tooth}`}
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
                    index === (showPrimaryTeeth ? 4 : 7) && "border-r-2 border-r-dental-100",
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
          <div className="text-sm font-medium text-center">
            {showPrimaryTeeth ? "QUADRANT 8 (Lower Right)" : "QUADRANT 4 (Lower Right)"}
          </div>
        </div>

        {/* Lower Left Quadrant */}
        <div className="space-y-2">
          <div className="flex justify-start">
            {lowerTeeth.slice(showPrimaryTeeth ? 5 : 8).map((tooth, index) => (
              <div
                key={`lower-left-${tooth}`}
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
                    index === 0 && "border-l-2 border-l-dental-100",
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
          <div className="text-sm font-medium text-center">
            {showPrimaryTeeth ? "QUADRANT 7 (Lower Left)" : "QUADRANT 3 (Lower Left)"}
          </div>
        </div>
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
