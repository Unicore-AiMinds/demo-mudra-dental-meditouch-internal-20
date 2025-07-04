import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SessionTimeoutContextType {
  isWarningVisible: boolean;
  timeRemaining: number;
  resetTimer: () => void;
  extendSession: () => void;
  logoutNow: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined);

export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (context === undefined) {
    throw new Error('useSessionTimeout must be used within a SessionTimeoutProvider');
  }
  return context;
};

export const SessionTimeoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Session timeout settings
  const IDLE_TIME = 13 * 60 * 1000; // 13 minutes in milliseconds
  const WARNING_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
  const TOTAL_SESSION_TIME = IDLE_TIME + WARNING_TIME; // 15 minutes total

  // Reset activity timer
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsWarningVisible(false);
    setTimeRemaining(120); // Reset to 2 minutes
  }, []);

  // Extend session (same as reset timer)
  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Force logout
  const logoutNow = useCallback(() => {
    setIsWarningVisible(false);
    logout();
  }, [logout]);

  // Activity event handlers
  const handleActivity = useCallback(() => {
    if (!isWarningVisible) {
      resetTimer();
    }
  }, [resetTimer, isWarningVisible]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, handleActivity]);

  // Main session timeout logic
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity >= TOTAL_SESSION_TIME) {
        // 15 minutes total - force logout
        logoutNow();
      } else if (timeSinceLastActivity >= IDLE_TIME && !isWarningVisible) {
        // 13 minutes - show warning
        setIsWarningVisible(true);
        setTimeRemaining(120); // Start 2-minute countdown
      }
    };

    const interval = setInterval(checkSession, 1000); // Check every second

    return () => clearInterval(interval);
  }, [user, lastActivity, isWarningVisible, logoutNow, IDLE_TIME, TOTAL_SESSION_TIME]);

  // Warning countdown timer
  useEffect(() => {
    if (!isWarningVisible) return;

    const countdown = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - logout
          logoutNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [isWarningVisible, logoutNow]);

  // Reset timer when user logs in
  useEffect(() => {
    if (user) {
      resetTimer();
    }
  }, [user, resetTimer]);

  return (
    <SessionTimeoutContext.Provider
      value={{
        isWarningVisible,
        timeRemaining,
        resetTimer,
        extendSession,
        logoutNow,
      }}
    >
      {children}
    </SessionTimeoutContext.Provider>
  );
};
