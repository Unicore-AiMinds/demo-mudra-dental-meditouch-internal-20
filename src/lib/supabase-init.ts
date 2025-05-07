/**
 * Supabase initialization utilities
 * 
 * This file provides utilities for initializing the Supabase database
 * with the necessary tables and initial data.
 */

import supabase from './supabase';
import { useToast } from '@/hooks/use-toast';

/**
 * Execute a SQL query against the Supabase database
 */
export async function executeSql(sql: string): Promise<any> {
  try {
    // Use the REST API to execute a SQL query
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        query: sql,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`SQL execution failed: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

/**
 * Initialize the Supabase database with the necessary tables
 * 
 * This function reads the SQL schema from the supabase-tables.sql file
 * and executes it against the Supabase database.
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Fetch the SQL schema
    const response = await fetch('/src/docs/supabase-tables.sql');
    if (!response.ok) {
      throw new Error(`Failed to fetch SQL schema: ${response.statusText}`);
    }

    const sqlSchema = await response.text();

    // Split the SQL schema into individual statements
    const statements = sqlSchema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await executeSql(`${statement};`);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Check if a table exists in the Supabase database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);

    if (error) {
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Component hook for initializing the database
 */
export function useInitializeDatabase() {
  const { toast } = useToast();

  const initialize = async () => {
    try {
      // Check if the users table exists
      const exists = await tableExists('users');
      
      if (!exists) {
        toast({
          title: 'Initializing Database',
          description: 'Setting up the database tables. This may take a moment...',
        });

        await initializeDatabase();
        
        toast({
          title: 'Database Initialized',
          description: 'The database has been successfully set up.',
        });
      } else {
        console.log('Database already initialized');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      toast({
        title: 'Database Initialization Failed',
        description: 'There was an error setting up the database. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return { initialize };
}

export default {
  executeSql,
  initializeDatabase,
  tableExists,
  useInitializeDatabase,
};
