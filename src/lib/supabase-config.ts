/**
 * Supabase Configuration - Single Source of Truth
 *
 * All Supabase credentials and the shared client instance are defined here.
 * Import from this file instead of hardcoding credentials elsewhere.
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://pwijqupjtminhcmtbxta.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3aWpxdXBqdG1pbmhjbXRieHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTM1NTgsImV4cCI6MjA4NjE2OTU1OH0.x3Xn3_JC2crG7yuB02xeR0bTF773aqNSHMMZgT1shLU';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
