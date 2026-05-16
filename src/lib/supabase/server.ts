import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components can't set cookies; safely ignore
        }
      }
    }
  });
}

// Service role client — only use in server actions/routes for admin work
import { createClient as createServiceClient } from '@supabase/supabase-js';
export function createServiceRoleClient() {
  return createServiceClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false }
  });
}
