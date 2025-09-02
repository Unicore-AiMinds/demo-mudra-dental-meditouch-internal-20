# Supabase Integration Guide

This guide explains how to use the Supabase integration in the Mudra Clinic application.

## Overview

The application is now connected to Supabase using the direct REST API approach. This allows you to:

- Fetch data from Supabase tables
- Insert new records
- Update existing records
- Delete records

## Configuration

The Supabase connection is configured in `src/lib/supabase.ts` using environment variables:

- **URL**: `VITE_SUPABASE_URL` environment variable
- **Anon Key**: `VITE_SUPABASE_ANON_KEY` environment variable

These values are loaded from your `.env` file or deployment environment variables.

## Usage

### 1. Access Supabase in Components

To use Supabase in your components, import the `useSupabase` hook:

```tsx
import { useSupabase } from '@/contexts/SupabaseContext';

const MyComponent = () => {
  const { fetchData, insertData, updateData, deleteData } = useSupabase();

  // Use these functions to interact with Supabase
  // ...
};
```

### 2. Fetching Data

To fetch data from a Supabase table:

```tsx
// Define your data type
interface Patient {
  id: number;
  name: string;
  email: string;
  // other fields...
}

// In your component
const { fetchData } = useSupabase();

// Fetch all records
const loadPatients = async () => {
  try {
    const patients = await fetchData<Patient>('patients');
    // Use the patients data
  } catch (error) {
    console.error('Error loading patients:', error);
  }
};

// Fetch with options
const loadPatientsWithOptions = async () => {
  try {
    const patients = await fetchData<Patient>('patients', {
      select: 'id,name,email', // Select specific columns
      order: { column: 'name', ascending: true }, // Order by name
      limit: 10, // Limit to 10 records
      filters: { status: 'active' } // Filter by status
    });
    // Use the patients data
  } catch (error) {
    console.error('Error loading patients:', error);
  }
};
```

### 3. Inserting Data

To insert a new record:

```tsx
const { insertData } = useSupabase();

const addPatient = async (patientData: Partial<Patient>) => {
  try {
    const newPatient = await insertData<Patient>('patients', patientData);
    // newPatient contains the newly created record
  } catch (error) {
    console.error('Error adding patient:', error);
  }
};
```

### 4. Updating Data

To update an existing record:

```tsx
const { updateData } = useSupabase();

const updatePatient = async (id: number, updates: Partial<Patient>) => {
  try {
    const updatedPatient = await updateData<Patient>('patients', id, updates);
    // updatedPatient contains the updated record
  } catch (error) {
    console.error('Error updating patient:', error);
  }
};
```

### 5. Deleting Data

To delete a record:

```tsx
const { deleteData } = useSupabase();

const deletePatient = async (id: number) => {
  try {
    await deleteData('patients', id);
    // Record deleted successfully
  } catch (error) {
    console.error('Error deleting patient:', error);
  }
};
```

### 6. Advanced Usage

For more advanced queries, you can use the raw Supabase client:

```tsx
const { supabase } = useSupabase();

// Example: Custom query with filters
const customQuery = async () => {
  try {
    const result = await supabase.from<Patient>('patients').getAll({
      filters: {
        'age': 'gt.30', // age > 30
        'status': 'eq.active' // status = active
      }
    });
    // Use the result
  } catch (error) {
    console.error('Error in custom query:', error);
  }
};
```

## Example Component

See `src/components/SupabaseExample.tsx` for a complete example of how to use the Supabase integration in a component.

## Database Schema

Before using Supabase, make sure to create the necessary tables in your Supabase database. You can do this through the Supabase dashboard.

Example schema for a `patients` table:

```sql
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

- The current implementation uses the anon key, which has limited permissions.
- For production, consider implementing proper authentication and row-level security in Supabase.
- Never expose sensitive operations to unauthenticated users.

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check the browser console for error messages
2. Verify that your Supabase URL and anon key are correct
3. Ensure that the table you're trying to access exists in your Supabase database
4. Check that you have the proper permissions set up in Supabase
