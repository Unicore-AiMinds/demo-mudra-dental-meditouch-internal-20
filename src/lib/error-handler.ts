import { PostgrestError } from '@supabase/supabase-js';

interface DatabaseErrorHandlerOptions {
  error: unknown;
  toast?: {
    toast: (props: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  };
  errorKey?: string;
  customMessage?: string;
  showToast?: boolean;
  logToConsole?: boolean;
}

/**
 * Handles database errors consistently across the application
 * 
 * @param options Configuration options for error handling
 * @returns The error object for further processing if needed
 */
export const handleDatabaseError = (options: DatabaseErrorHandlerOptions): unknown => {
  const {
    error,
    toast,
    errorKey = 'database_error',
    customMessage = 'An error occurred while accessing the database.',
    showToast = true,
    logToConsole = true
  } = options;

  // Log the error to console if requested
  if (logToConsole) {
    if (error instanceof Error) {
      console.error(`Database error (${errorKey}):`, error.message, error.stack);
    } else if ((error as PostgrestError)?.code && (error as PostgrestError)?.message) {
      // Handle Supabase PostgrestError
      const pgError = error as PostgrestError;
      console.error(`Database error (${errorKey}):`, pgError.message, `Code: ${pgError.code}`);
    } else {
      console.error(`Database error (${errorKey}):`, error);
    }
  }

  // Show toast notification if requested and toast is available
  if (showToast && toast) {
    let description = customMessage;

    // Add more specific error information if available
    if (error instanceof Error) {
      description = `${customMessage} ${error.message}`;
    } else if ((error as PostgrestError)?.message) {
      description = `${customMessage} ${(error as PostgrestError).message}`;
    }

    toast.toast({
      title: 'Error',
      description,
      variant: 'destructive',
    });
  }

  return error;
};
