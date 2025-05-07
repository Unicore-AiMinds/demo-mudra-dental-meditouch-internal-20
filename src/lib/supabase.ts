/**
 * Supabase client for direct REST API access
 * 
 * This file provides utilities for interacting with the Supabase database
 * using the direct REST API approach.
 */

// Supabase configuration
const SUPABASE_URL = 'https://otvhtpnmunoazgqhennu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmh0cG5tdW5vYXpncWhlbm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MDEwMTAsImV4cCI6MjA2MjE3NzAxMH0.TeZa-YGzfToszrWrMomsjw3R9mRxFR-7NE7sNLFi9JM';

/**
 * Generic function to make a request to the Supabase REST API
 */
async function supabaseRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data?: any,
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
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Supabase request failed: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ''
        }`
      );
    }

    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('Supabase request error:', error);
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
      filters?: Record<string, any>;
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
      let path = table;
      if (options?.filters) {
        const filterEntries = Object.entries(options.filters);
        if (filterEntries.length > 0) {
          filterEntries.forEach(([key, value]) => {
            params[key] = `eq.${value}`;
          });
        }
      }

      return supabaseRequest<T[]>(path, 'GET', undefined, { params });
    },

    /**
     * Get a single record by ID
     */
    getById: async (id: string | number, options?: { select?: string }): Promise<T> => {
      const params: Record<string, string> = {};
      
      if (options?.select) {
        params.select = options.select;
      }
      
      return supabaseRequest<T>(`${table}?id=eq.${id}`, 'GET', undefined, {
        params,
        headers: { 'Prefer': 'return=representation' }
      });
    },

    /**
     * Insert a new record
     */
    insert: async (data: Partial<T>): Promise<T> => {
      return supabaseRequest<T>(table, 'POST', data);
    },

    /**
     * Update a record by ID
     */
    update: async (id: string | number, data: Partial<T>): Promise<T> => {
      return supabaseRequest<T>(`${table}?id=eq.${id}`, 'PATCH', data);
    },

    /**
     * Delete a record by ID
     */
    delete: async (id: string | number): Promise<void> => {
      await supabaseRequest<void>(`${table}?id=eq.${id}`, 'DELETE');
    },
  }),
};

export default supabase;
