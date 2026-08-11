import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client — uses the service-role key.
 * This bypasses Row Level Security and should ONLY be used in
 * server-side API routes, never in client components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'These must be set in .env.local for server-side operations.'
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
