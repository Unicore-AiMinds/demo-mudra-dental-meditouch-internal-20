/**
 * Supabase initialization utilities
 *
 * This file provides utilities for initializing the Supabase database
 * with the necessary tables and initial data.
 */

import supabase from './supabase';
import { useToast } from '@/hooks/use-toast';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config';

/**
 * Execute a SQL query against the Supabase database
 */
export async function executeSql(sql: string): Promise<any> {
  try {
    // Use the REST API to execute a SQL query
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
    console.log('Starting database initialization...');

    // SQL statements for creating tables
    const sqlStatements = [
      // Enable UUID extension
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

      // Users Table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'inventory')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Clinics Table
      `CREATE TABLE IF NOT EXISTS clinics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('dental', 'meditouch')),
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Doctors Table
      `CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Patients Table
      `CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
        age INTEGER,
        date_of_birth DATE,
        email TEXT,
        phone TEXT NOT NULL,
        address TEXT,
        city TEXT,
        pincode TEXT,
        blood_group TEXT,
        clinic TEXT NOT NULL CHECK (clinic IN ('dental', 'meditouch', 'both')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Appointments Table
      `CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        appointment_id TEXT UNIQUE NOT NULL,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        time TEXT NOT NULL,
        service TEXT NOT NULL,
        date DATE NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('confirmed', 'arrived', 'completed', 'cancelled')),
        doctor TEXT,
        second_patient_name TEXT,
        notes TEXT,
        clinic_type TEXT NOT NULL CHECK (clinic_type IN ('dental', 'meditouch')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Dental Charting Table
      `CREATE TABLE IF NOT EXISTS dental_charting (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entry_id TEXT UNIQUE NOT NULL,
        patient_id TEXT NOT NULL,
        date_recorded TIMESTAMP WITH TIME ZONE NOT NULL,
        tooth_numbers TEXT[] NOT NULL,
        surfaces TEXT[],
        finding TEXT,
        service TEXT,
        status TEXT NOT NULL CHECK (status IN ('Existing', 'Planned', 'Completed')),
        notes TEXT,
        doctor TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Dental History Table
      `CREATE TABLE IF NOT EXISTS dental_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        appointment_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        date DATE NOT NULL,
        service TEXT NOT NULL,
        doctor TEXT NOT NULL,
        payment_status TEXT CHECK (payment_status IN ('paid', 'unpaid')),
        diagnosis_notes TEXT,
        treatment_plan_suggested TEXT,
        procedure_performed_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Follow-ups Table
      `CREATE TABLE IF NOT EXISTS follow_ups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        follow_up_id TEXT UNIQUE NOT NULL,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        based_on_appointment_id TEXT,
        tentative_date DATE NOT NULL,
        follow_up_sequence INTEGER,
        total_steps_in_sequence INTEGER,
        sequence_group_id TEXT,
        suggested_service_name TEXT,
        original_service TEXT,
        original_doctor TEXT,
        status TEXT NOT NULL CHECK (status IN ('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Snoozed')),
        notes TEXT,
        snoozed_until DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`,

      // Services with Follow-up Table
      `CREATE TABLE IF NOT EXISTS services_with_follow_up (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        requires_follow_up BOOLEAN NOT NULL DEFAULT false,
        default_follow_up_interval_days INTEGER,
        number_of_follow_ups INTEGER,
        follow_up_service_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    // Execute each statement
    for (const statement of sqlStatements) {
      console.log(`Executing SQL: ${statement.substring(0, 50)}...`);
      await executeSql(statement);
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
