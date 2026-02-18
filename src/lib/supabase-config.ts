/**
 * Supabase Configuration - Single Source of Truth
 *
 * All Supabase credentials and the shared client instance are defined here.
 * Import from this file instead of hardcoding credentials elsewhere.
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://cqtloiklvpvafeoiyyhy.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGxvaWtsdnB2YWZlb2l5eWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE1MjAsImV4cCI6MjA2Mjk2NzUyMH0.iaGIQNydn1xK8SQXidXLHya6X2qUtQGq0lVqGw8OZbw';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
