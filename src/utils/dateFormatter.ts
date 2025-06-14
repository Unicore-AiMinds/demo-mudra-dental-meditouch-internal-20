/**
 * Utility functions for formatting dates in IST timezone for exports and display
 */

/**
 * Formats a date to IST timezone with space between date and time
 * @param date - Date string or Date object
 * @param includeTime - Whether to include time (default: true)
 * @returns Formatted date string in IST timezone
 */
export const formatDateToIST = (date: string | Date, includeTime: boolean = true): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Format to IST timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = false; // Use 24-hour format
    }
    
    const formatted = dateObj.toLocaleString('en-IN', options);
    
    if (includeTime) {
      // Replace comma with space to get "DD/MM/YYYY HH:MM:SS" format
      return formatted.replace(',', '');
    } else {
      return formatted;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a date for CSV export with proper IST timezone
 * @param date - Date string or Date object
 * @returns Formatted date string suitable for CSV export
 */
export const formatDateForExport = (date: string | Date): string => {
  return formatDateToIST(date, true);
};

/**
 * Formats a date for display in the UI
 * @param date - Date string or Date object
 * @param includeTime - Whether to include time (default: true)
 * @returns Formatted date string for UI display
 */
export const formatDateForDisplay = (date: string | Date, includeTime: boolean = true): string => {
  return formatDateToIST(date, includeTime);
};

/**
 * Formats a date to ISO format in IST timezone for database storage
 * @param date - Date string or Date object
 * @returns ISO formatted date string in IST timezone
 */
export const formatDateToISOIST = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(dateObj.getTime() + istOffset);
    
    // Format as ISO string but replace 'Z' with IST offset
    return istDate.toISOString().replace('Z', '+05:30');
  } catch (error) {
    console.error('Error formatting date to ISO IST:', error);
    return '';
  }
};

/**
 * Gets current date and time in IST timezone
 * @param includeTime - Whether to include time (default: true)
 * @returns Current date/time in IST timezone
 */
export const getCurrentDateTimeIST = (includeTime: boolean = true): string => {
  return formatDateToIST(new Date(), includeTime);
};

/**
 * Formats a date for filename (removes special characters)
 * @param date - Date string or Date object
 * @returns Date string suitable for filenames
 */
export const formatDateForFilename = (date: string | Date = new Date()): string => {
  const formatted = formatDateToIST(date, false);
  // Replace slashes with dashes for filename compatibility
  return formatted.replace(/\//g, '-');
};
