import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration from environment variables
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://hptaarigzvndqkhpaodp.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_pfg6HPxYxwhlog3l42pQ-A_fKbTRLI2';

// Check if valid client credentials exist
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    SUPABASE_PUBLISHABLE_KEY.length > 20
  );
};

// Initialize Supabase Client with persistent session handling
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder_pending_env',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'instasaldo_supabase_auth_token',
    },
  }
);

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  hasKey: isSupabaseConfigured(),
  projectRef: 'hptaarigzvndqkhpaodp',
};
