import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a Supabase browser client. During Next.js static prerendering,
 * env vars may be absent; in that case we return a placeholder URL/key so
 * module evaluation doesn't throw. Real requests still require the values
 * at runtime, where they'll be injected by Vercel.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://placeholder.local';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createBrowserClient(url, key);
}
