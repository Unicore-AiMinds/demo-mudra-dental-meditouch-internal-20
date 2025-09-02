/**
 * Supabase client for direct REST API access
 *
 * This file provides utilities for interacting with the Supabase database
 * using the direct REST API approach.
 */

// Supabase configuration - using environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Disable mock mode completely - always use real Supabase
const USE_MOCK_MODE = false;

/**
 * Generic function to make a request to the Supabase REST API
 */
async function supabaseRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data?: Record<string, unknown>,
  options?: {
    headers?: Record<string, string>;
    params?: Record<string, string>;
  }
): Promise<T> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);

  // Add query parameters if provided
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Default headers for Supabase
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options?.headers,
  };

  try {
    console.log(`[SUPABASE] Making ${method} request to ${url.toString()}`);
    console.log('[SUPABASE] Request data:', JSON.stringify(data, null, 2));
    console.log('[SUPABASE] Request headers:', JSON.stringify(headers, null, 2));

    // Log the table name from the path
    const tableName = path.split('?')[0];
    console.log(`[SUPABASE] Target table: ${tableName}`);

    // Check if the table exists in Supabase
    console.log(`[SUPABASE] Verifying table '${tableName}' exists`);

    // Make the actual request
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`[SUPABASE] Response status: ${response.status} ${response.statusText}`);
    console.log(`[SUPABASE] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error(`[SUPABASE] Error response body:`, JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error(`[SUPABASE] Could not parse error response as JSON:`, e);
        const textResponse = await response.text().catch(() => 'Could not read response text');
        console.error(`[SUPABASE] Raw error response:`, textResponse);
        errorData = { message: 'Could not parse error response' };
      }

      // Log detailed error information
      console.error(`[SUPABASE] ${method} request failed:`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: url.toString(),
        data,
        headers: Object.fromEntries(response.headers.entries())
      });

      // For debugging purposes, log the full request details
      console.error('[SUPABASE] Full request details:', {
        method,
        url: url.toString(),
        headers,
        body: data ? JSON.stringify(data, null, 2) : undefined
      });

      throw new Error(
        `Supabase request failed: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ''
        }`
      );
    }

    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      console.log('[SUPABASE] DELETE request successful (204 No Content)');
      return {} as T;
    }

    let responseData;
    try {
      responseData = await response.json();
      console.log(`[SUPABASE] ${method} request succeeded with data:`, JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.error(`[SUPABASE] Could not parse success response as JSON:`, e);
      const textResponse = await response.text().catch(() => 'Could not read response text');
      console.error(`[SUPABASE] Raw success response:`, textResponse);
      throw new Error(`Could not parse Supabase response as JSON: ${e}`);
    }

    return responseData;
  } catch (error) {
    console.error('[SUPABASE] Request error:', error);
    if (error instanceof Error) {
      console.error('[SUPABASE] Error message:', error.message);
      console.error('[SUPABASE] Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Generic CRUD operations for any table
 */
export const supabase = {
  /**
   * Fetch all records from a table
   */
  from: <T>(table: string) => ({
    /**
     * Get all records from the table
     */
    getAll: async (options?: {
      select?: string;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
      filters?: Record<string, unknown>;
    }): Promise<T[]> => {
      const params: Record<string, string> = {};

      if (options?.select) {
        params.select = options.select;
      }

      if (options?.order) {
        params.order = `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`;
      }

      if (options?.limit) {
        params.limit = options.limit.toString();
      }

      if (options?.offset) {
        params.offset = options.offset.toString();
      }

      // Add filters if provided
      const tablePath = table;
      if (options?.filters) {
        const filterEntries = Object.entries(options.filters);
        console.log(`[SUPABASE] Applying filters to ${table}:`, options.filters);
        if (filterEntries.length > 0) {
          filterEntries.forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && 'in' in value) {
              // Handle 'in' operator for arrays
              const inValue = (value as { in: unknown[] }).in;
              params[key] = `in.(${inValue.join(',')})`;
              console.log(`[SUPABASE] Applied 'in' filter: ${key} = ${params[key]}`);
            } else {
              // Default to equality
              params[key] = `eq.${value}`;
              console.log(`[SUPABASE] Applied 'eq' filter: ${key} = ${params[key]}`);
            }
          });
        }
      }

      // Add default sorting for patients table - newest first
      if (table === 'patients' && !params.order) {
        params.order = 'created_at.desc';
        console.log('Adding default sorting for patients table: created_at.desc');
      }

      try {
        return await supabaseRequest<T[]>(tablePath, 'GET', undefined, { params });
      } catch (error) {
        console.error(`Error fetching from ${table}:`, error);

        // Return empty array for GET requests to avoid breaking the UI
        // This allows the app to show empty state instead of crashing
        console.warn(`Returning empty array for ${table} due to error`);
        return [];
      }
    },

    /**
     * Get a single record by ID
     */
    getById: async (id: string | number, options?: { select?: string }): Promise<T | null> => {
      const params: Record<string, string> = {};

      if (options?.select) {
        params.select = options.select;
      }

      try {
        console.log(`Fetching record from ${table} with ID ${id}`);

        const result = await supabaseRequest<T[]>(`${table}?id=eq.${id}`, 'GET', undefined, {
          params,
          headers: { 'Prefer': 'return=representation' }
        });

        // Supabase returns an array, but we want a single object
        if (result && result.length > 0) {
          return result[0];
        }

        console.warn(`No record found in ${table} with ID ${id}`);
        return null;
      } catch (error) {
        console.error(`Error fetching record from ${table} with ID ${id}:`, error);
        return null;
      }
    },

    /**
     * Insert a new record
     */
    insert: async (data: Partial<T>): Promise<T> => {
      // Add timestamps if they don't exist
      const dataWithTimestamps = {
        ...data,
        created_at: (data as Record<string, unknown>).created_at || new Date().toISOString(),
        updated_at: (data as Record<string, unknown>).updated_at || new Date().toISOString()
      };

      try {
        // Log the data being sent
        console.log(`Inserting data into ${table}:`, dataWithTimestamps);

        // Always use the real Supabase database
        console.log('REAL MODE: Using Supabase for insert');
        // Make the actual request to Supabase with return=representation header
        return await supabaseRequest<T>(table, 'POST', dataWithTimestamps, {
          headers: { 'Prefer': 'return=representation' }
        });
      } catch (error) {
        console.error(`Error inserting into ${table}:`, error);
        throw error;
      }
    },

    /**
     * Update a record by ID
     */
    update: async (id: string | number, data: Partial<T>): Promise<T> => {
      // Add updated_at timestamp
      const dataWithTimestamp = {
        ...data,
        updated_at: new Date().toISOString()
      };

      try {
        // Log the data being sent
        console.log(`Updating data in ${table} for ID ${id}:`, dataWithTimestamp);

        // Always use the real Supabase database
        console.log('REAL MODE: Using Supabase for update');
        // Make the actual request to Supabase with return=representation header
        return await supabaseRequest<T>(`${table}?id=eq.${id}`, 'PATCH', dataWithTimestamp, {
          headers: { 'Prefer': 'return=representation' }
        });
      } catch (error) {
        console.error(`Error updating in ${table}:`, error);
        throw error;
      }
    },

    /**
     * Delete a record by ID
     */
    delete: async (id: string | number): Promise<void> => {
      try {
        // Log the delete operation
        console.log(`Deleting record from ${table} with ID ${id}`);

        // Always use the real Supabase database
        console.log('REAL MODE: Using Supabase for delete');
        // Make the actual request to Supabase
        await supabaseRequest<void>(`${table}?id=eq.${id}`, 'DELETE');

        console.log(`Successfully deleted record from ${table} with ID ${id}`);
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
    },
  }),
};

export default supabase;
