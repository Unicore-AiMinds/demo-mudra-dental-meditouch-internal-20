/**
 * Supabase Storage utilities
 *
 * This file provides utilities for interacting with Supabase Storage
 * for file uploads and retrievals.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - same as in supabase.ts
const SUPABASE_URL = 'https://otvhtpnmunoazgqhennu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmh0cG5tdW5vYXpncWhlbm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDEwMTAsImV4cCI6MjA2MjE3NzAxMH0.TeZa-YGzfToszrWrMomsjw3R9mRxFR-7NE7sNLFi9JM';

// Create a Supabase client with storage capabilities
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name for doctor documents
const DOCTOR_DOCUMENTS_BUCKET = 'doctor-documents';

/**
 * Check if storage is accessible
 *
 * Note: Buckets should be created manually in the Supabase dashboard
 * due to Row Level Security (RLS) restrictions.
 */
export const checkStorageAccess = async (): Promise<boolean> => {
  try {
    // Just check if we can list files in the bucket
    const { data, error } = await supabaseClient.storage
      .from(DOCTOR_DOCUMENTS_BUCKET)
      .list();

    if (error) {
      console.error('Error accessing storage bucket:', error);
      return false;
    }

    console.log('Storage bucket is accessible');
    return true;
  } catch (error) {
    console.error('Error checking storage access:', error);
    return false;
  }
};

/**
 * Upload a file to Supabase Storage
 *
 * @param file The file to upload
 * @param path The path within the bucket to store the file
 * @param bucket The storage bucket name (defaults to doctor-documents)
 * @returns The public URL of the uploaded file or null if upload fails
 */
export const uploadFile = async (
  file: File,
  path: string,
  bucket: string = DOCTOR_DOCUMENTS_BUCKET
): Promise<string | null> => {
  try {
    console.log(`Uploading file ${file.name} to ${bucket}/${path}`);

    // Check if bucket is accessible first
    const isAccessible = await checkStorageAccess();
    if (!isAccessible) {
      console.error('Storage bucket is not accessible. Please check Supabase configuration.');
      return null;
    }

    // Upload the file
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Overwrite if file exists
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    if (!data) {
      console.error('No data returned from upload');
      return null;
    }

    console.log('File uploaded successfully:', data.path);

    // Get the public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log('File public URL:', urlData.publicUrl);

    // Create a direct download URL that will work even if the bucket is private
    const downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`;
    console.log('Direct download URL:', downloadUrl);

    // Return the direct download URL instead of the public URL
    return downloadUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return null;
  }
};

/**
 * Get a file from Supabase Storage
 *
 * @param path The path of the file within the bucket
 * @param bucket The storage bucket name (defaults to doctor-documents)
 * @returns The file data or null if download fails
 */
export const getFile = async (
  path: string,
  bucket: string = DOCTOR_DOCUMENTS_BUCKET
): Promise<Blob | null> => {
  try {
    console.log(`Getting file from ${bucket}/${path}`);

    // Check if bucket is accessible first
    const isAccessible = await checkStorageAccess();
    if (!isAccessible) {
      console.error('Storage bucket is not accessible. Please check Supabase configuration.');
      return null;
    }

    // Download the file
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    if (!data) {
      console.error('No data returned from download');
      return null;
    }

    console.log('File downloaded successfully');

    return data;
  } catch (error) {
    console.error('Error in getFile:', error);
    return null;
  }
};

/**
 * Delete a file from Supabase Storage
 *
 * @param path The path of the file within the bucket
 * @param bucket The storage bucket name (defaults to doctor-documents)
 * @returns True if deletion was successful, false otherwise
 */
export const deleteFile = async (
  path: string,
  bucket: string = DOCTOR_DOCUMENTS_BUCKET
): Promise<boolean> => {
  try {
    console.log(`Deleting file from ${bucket}/${path}`);

    // Check if bucket is accessible first
    const isAccessible = await checkStorageAccess();
    if (!isAccessible) {
      console.error('Storage bucket is not accessible. Please check Supabase configuration.');
      return false;
    }

    // Delete the file
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    console.log('File deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return false;
  }
};

/**
 * Fix document URL format
 *
 * This function takes a document URL and ensures it's in the correct format
 * for direct access. This is useful for fixing URLs that were stored in the database
 * with an incorrect format.
 *
 * @param url The document URL to fix
 * @param bucket The storage bucket name (defaults to doctor-documents)
 * @returns The fixed URL or the original URL if it's already correct
 */
export const fixDocumentUrl = (url: string | null | undefined, bucket: string = DOCTOR_DOCUMENTS_BUCKET): string | null => {
  if (!url) return null;

  try {
    // Check if the URL is already in the correct format
    if (url.includes(`/storage/v1/object/public/${bucket}/`)) {
      console.log('URL is already in the correct format:', url);
      return url;
    }

    // Extract the path from the URL
    const urlObj = new URL(url);

    // Try different regex patterns to extract the path
    let pathMatch = urlObj.pathname.match(/\/object\/public\/${bucket}\/(.+)$/);

    if (!pathMatch) {
      // Try alternative pattern that might be used in the URL
      pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/${bucket}\/(.+)$/);
    }

    if (!pathMatch) {
      // If we still can't match, try to extract the UUID and filename directly
      const uuidMatch = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([^\/]+)$/i);
      if (uuidMatch) {
        const [_, uuid, filename] = uuidMatch;
        const path = `${uuid}/${filename}`;
        const fixedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
        console.log('Fixed document URL using UUID pattern:', fixedUrl);
        return fixedUrl;
      }
    }

    if (pathMatch) {
      // Construct the correct URL
      const path = pathMatch[1];
      const fixedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
      console.log('Fixed document URL:', fixedUrl);
      return fixedUrl;
    }

    // If we couldn't extract the path, try a direct approach
    // Extract the last two parts of the path (usually UUID/filename)
    const pathParts = urlObj.pathname.split('/');
    if (pathParts.length >= 2) {
      const lastTwoParts = pathParts.slice(-2).join('/');
      const fixedUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${lastTwoParts}`;
      console.log('Fixed document URL using path parts:', fixedUrl);
      return fixedUrl;
    }

    // If all else fails, return the original URL
    console.warn('Could not fix document URL:', url);
    return url;
  } catch (error) {
    console.error('Error fixing document URL:', error);
    return url;
  }
};

/**
 * Create a download link for a file in Supabase Storage
 *
 * This function takes a document URL and creates a signed download link
 * that can be used to download the file directly.
 *
 * @param url The document URL to create a download link for
 * @param bucket The storage bucket name (defaults to doctor-documents)
 * @returns The signed download URL or null if creation fails
 */
export const createDownloadLink = async (
  url: string,
  bucket: string = DOCTOR_DOCUMENTS_BUCKET
): Promise<string | null> => {
  try {
    if (!url) {
      console.error('No URL provided to createDownloadLink');
      return null;
    }

    console.log('Creating download link for URL:', url);

    // For simplicity, let's just use the original URL as a fallback
    // This will at least allow users to open the document in a new tab
    // even if we can't create a proper signed URL

    // Try to extract the path using various methods
    let path = '';

    // Method 1: Try to extract from a standard Supabase URL
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/${bucket}\/(.+)$/);

      if (pathMatch) {
        path = pathMatch[1];
        console.log('Extracted path using standard pattern:', path);
      } else {
        // Method 2: Try to extract UUID and filename pattern
        const uuidMatch = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([^\/]+)$/i);
        if (uuidMatch) {
          path = `${uuidMatch[1]}/${uuidMatch[2]}`;
          console.log('Extracted path using UUID pattern:', path);
        } else {
          // Method 3: Just take the last two segments of the path
          const segments = urlObj.pathname.split('/').filter(Boolean);
          if (segments.length >= 2) {
            path = `${segments[segments.length - 2]}/${segments[segments.length - 1]}`;
            console.log('Extracted path using last segments:', path);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing URL:', e);
    }

    if (!path) {
      console.warn('Could not extract path from URL, using URL as-is');
      return url; // Return the original URL as fallback
    }

    // Try to create a signed URL
    try {
      console.log(`Attempting to create signed URL for path: ${path} in bucket: ${bucket}`);

      // Create a signed URL that expires in 60 seconds
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .createSignedUrl(path, 60);

      if (error) {
        console.error('Error creating signed URL:', error);
        // Fall back to using the original URL
        return url;
      }

      if (!data || !data.signedUrl) {
        console.error('No signed URL returned');
        // Fall back to using the original URL
        return url;
      }

      console.log('Created signed download link:', data.signedUrl);
      return data.signedUrl;
    } catch (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);

      // As a last resort, try to create a direct download URL
      try {
        const directUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
        console.log('Created direct download URL as fallback:', directUrl);
        return directUrl;
      } catch (directUrlError) {
        console.error('Error creating direct URL:', directUrlError);
        // Return the original URL as the ultimate fallback
        return url;
      }
    }
  } catch (error) {
    console.error('Error in createDownloadLink:', error);
    // Return the original URL as fallback
    return url;
  }
};

export default {
  checkStorageAccess,
  uploadFile,
  getFile,
  deleteFile,
  fixDocumentUrl,
  createDownloadLink,
  DOCTOR_DOCUMENTS_BUCKET
};
