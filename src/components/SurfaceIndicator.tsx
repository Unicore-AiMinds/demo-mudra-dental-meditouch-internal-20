import React from 'react';
import { cn } from '@/lib/utils';

interface SurfaceIndicatorProps {
  surfaces: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
  onSurfaceClick?: (surface: string) => void;
}

const SurfaceIndicator: React.FC<SurfaceIndicatorProps> = ({
  surfaces = [],
  size = 'sm',
  className,
  interactive = false,
  onSurfaceClick
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  // Check if a surface is selected
  const isSurfaceSelected = (surface: string) => surfaces.includes(surface);

  // Handle surface click
  const handleSurfaceClick = (surface: string) => {
    if (interactive && onSurfaceClick) {
      onSurfaceClick(surface);
    }
  };

  // Get interactive classes
  const getInteractiveClasses = (surface: string) => {
    if (interactive) {
      return "cursor-pointer hover:opacity-80 transition-opacity";
    }
    return "";
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Tooth shape */}
      <div className="absolute inset-0 border border-gray-300 rounded-md"></div>

      {/* Mesial (M) - Top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1/3 border-b border-gray-300",
          isSurfaceSelected('M') ? "bg-dental-primary" : "bg-gray-100",
          getInteractiveClasses('M')
        )}
        title="Mesial"
        onClick={() => handleSurfaceClick('M')}
      ></div>

      {/* Occlusal (O) - Center */}
      <div
        className={cn(
          "absolute top-1/3 left-1/3 right-1/3 bottom-1/3 border border-gray-300 rounded-sm",
          isSurfaceSelected('O') ? "bg-dental-primary" : "bg-gray-100",
          getInteractiveClasses('O')
        )}
        title="Occlusal"
        onClick={() => handleSurfaceClick('O')}
      ></div>

      {/* Distal (D) - Bottom */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1/3 border-t border-gray-300",
          isSurfaceSelected('D') ? "bg-dental-primary" : "bg-gray-100",
          getInteractiveClasses('D')
        )}
        title="Distal"
        onClick={() => handleSurfaceClick('D')}
      ></div>

      {/* Buccal/Facial (B/F) - Right */}
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 w-1/3 border-l border-gray-300",
          isSurfaceSelected('B/F') ? "bg-dental-primary" : "bg-gray-100",
          getInteractiveClasses('B/F')
        )}
        title="Buccal/Facial"
        onClick={() => handleSurfaceClick('B/F')}
      ></div>

      {/* Lingual (L) - Left */}
      <div
        className={cn(
          "absolute top-0 left-0 bottom-0 w-1/3 border-r border-gray-300",
          isSurfaceSelected('L') ? "bg-dental-primary" : "bg-gray-100",
          getInteractiveClasses('L')
        )}
        title="Lingual"
        onClick={() => handleSurfaceClick('L')}
      ></div>
    </div>
  );
};

export default SurfaceIndicator;
