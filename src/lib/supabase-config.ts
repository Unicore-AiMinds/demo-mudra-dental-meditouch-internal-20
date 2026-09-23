/**
 * Supabase Configuration - Single Source of Truth
 *
 * Credentials come from environment variables (Vite `VITE_` prefix), so the
 * database target is decided by the environment, never hardcoded:
 *   - Local development: `.env` -> DEV project (pwijqupjtminhcmtbxta)
 *   - Production (Netlify): configured env vars -> PRODUCTION project (cqtloiklvpvafeoiyyhy)
 *
 * There is intentionally NO hardcoded fallback: if the env vars are missing we
 * fail loudly rather than silently connecting to the wrong database.
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    '(see .env.example). Local dev should point at the DEV project, not production.'
  );
}

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
