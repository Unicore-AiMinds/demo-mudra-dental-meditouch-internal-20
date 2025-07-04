import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSessionTimeout } from '@/contexts/SessionTimeoutContext';
import { AlertTriangle, Clock } from 'lucide-react';

const SessionTimeoutModal: React.FC = () => {
  const { isWarningVisible, timeRemaining, extendSession, logoutNow } = useSessionTimeout();

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get color based on time remaining
  const getTimeColor = (seconds: number): string => {
    if (seconds <= 30) return 'text-red-600';
    if (seconds <= 60) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <Dialog open={isWarningVisible} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        // Prevent closing by clicking outside or pressing escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            For your security, your session is about to end due to inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-gray-500" />
            <span className="text-sm text-gray-600">You will be logged out in:</span>
          </div>
          
          <div className={`text-6xl font-mono font-bold ${getTimeColor(timeRemaining)} mb-2`}>
            {formatTime(timeRemaining)}
          </div>
          
          <div className="text-sm text-gray-500">
            minutes:seconds
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeRemaining <= 30 
                  ? 'bg-red-500' 
                  : timeRemaining <= 60 
                    ? 'bg-orange-500' 
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${(timeRemaining / 120) * 100}%` }}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={logoutNow}
            className="flex-1"
          >
            Logout Now
          </Button>
          <Button
            onClick={extendSession}
            className="flex-1 bg-dental-primary hover:bg-dental-dark"
          >
            Continue Session
          </Button>
        </DialogFooter>

        <div className="text-xs text-center text-gray-500 mt-2">
          Click "Continue Session" to extend your session, or "Logout Now" to logout immediately.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeoutModal;
