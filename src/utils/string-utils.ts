/**
 * Utility functions for string manipulation
 */

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Capitalizes the first letter of each word in a string
 * @param str The string to capitalize
 * @returns The string with the first letter of each word capitalized
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
};

/**
 * Formats a phone number to a standard format
 * @param phoneNumber The phone number to format
 * @returns The formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;
  
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's an Indian phone number (10 digits)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  // Return as is if it doesn't match expected format
  return phoneNumber;
};

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * @param str The string to truncate
 * @param maxLength The maximum length of the string
 * @returns The truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Converts a string to kebab-case
 * @param str The string to convert
 * @returns The kebab-case string
 */
export const toKebabCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

/**
 * Converts a string to camelCase
 * @param str The string to convert
 * @returns The camelCase string
 */
export const toCamelCase = (str: string): string => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};

/**
 * Removes all HTML tags from a string
 * @param html The HTML string to clean
 * @returns The string without HTML tags
 */
export const stripHtml = (html: string): string => {
  if (!html) return html;
  return html.replace(/<[^>]*>/g, '');
};
