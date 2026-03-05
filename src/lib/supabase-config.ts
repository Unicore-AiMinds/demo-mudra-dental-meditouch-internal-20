/**
 * Supabase Configuration - Single Source of Truth
 *
 * All Supabase credentials and the shared client instance are defined here.
 * Import from this file instead of hardcoding credentials elsewhere.
 *
 * Values are loaded from environment variables (VITE_ prefix for Vite).
 * Set them in the .env file at the project root.
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
