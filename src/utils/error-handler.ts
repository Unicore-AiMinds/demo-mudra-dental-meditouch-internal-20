/**
 * Utility functions for handling errors consistently across the application
 */

import { toast as toastFunction } from "@/components/ui/use-toast";

// Interface for the error handler options
interface ErrorHandlerOptions {
  // The error object
  error: unknown;
  // The toast function from useToast hook
  toast: typeof toastFunction;
  // A unique key to prevent duplicate toasts (optional)
  errorKey?: string;
  // Custom error message (optional)
  customMessage?: string;
  // Whether to show a toast notification (default: true)
  showToast?: boolean;
  // Whether to log the error to console (default: true)
  logError?: boolean;
}

/**
 * Handle database-related errors consistently
 *
 * This function:
 * 1. Logs the error to console (if logError is true)
 * 2. Shows a toast notification (if showToast is true)
 * 3. Prevents duplicate toasts for the same error (if errorKey is provided)
 * 4. Handles common database errors gracefully
 *
 * @param options The error handler options
 * @returns true if the error was handled, false otherwise
 */
export const handleDatabaseError = (options: ErrorHandlerOptions): boolean => {
  const {
    error,
    toast,
    errorKey,
    customMessage,
    showToast = true,
    logError = true
  } = options;

  // Log the error to console
  if (logError) {
    console.error(error);
  }

  // Check if this is a "table does not exist" error
  const isTableNotExistError = error instanceof Error &&
    (error.message.includes('relation') && error.message.includes('does not exist'));

  // Check if this is a "foreign key constraint" error
  const isForeignKeyError = error instanceof Error &&
    error.message.includes('foreign key constraint');

  // If this is a known database initialization error, handle it gracefully
  if (isTableNotExistError || isForeignKeyError) {
    if (showToast) {
      // Only show the toast once per session for this specific error
      if (errorKey) {
        if (sessionStorage.getItem(errorKey)) {
          return true;
        }
        sessionStorage.setItem(errorKey, 'true');
      }

      // Show a user-friendly message
      toast({
        title: 'Notice',
        description: customMessage || 'Some data will be available after database setup is complete.',
      });
    }
    return true;
  }

  // For other errors, show the error message if requested
  if (showToast && !isTableNotExistError && !isForeignKeyError) {
    // Only show the toast once per session for this specific error
    if (errorKey) {
      if (sessionStorage.getItem(errorKey)) {
        return false;
      }
      sessionStorage.setItem(errorKey, 'true');
    }

    // Show the error message
    toast({
      title: 'Error',
      description: customMessage || 'An error occurred. Please try again.',
      variant: 'destructive',
    });
  }

  return false;
};
