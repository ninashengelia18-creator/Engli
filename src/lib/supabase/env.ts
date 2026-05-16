/**
 * Centralized Supabase env access.
 *
 * Vercel preview builds (and any CI build without secrets) don't ship the
 * NEXT_PUBLIC_SUPABASE_* values. If we pass `undefined` into @supabase/ssr it
 * throws during Next's static prerender step and the whole build fails — even
 * for pages that don't actually need Supabase at request time.
 *
 * We return obviously-fake placeholder values when the real env is missing so
 * that client construction succeeds at build time. Any network call against
 * these placeholders will fail at runtime, which is the desired behavior: a
 * deployment without real env vars is broken on purpose, but the build itself
 * survives so Vercel can show a preview with the static pages.
 */

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key';
const PLACEHOLDER_SERVICE_ROLE_KEY = 'placeholder-service-role-key';

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_ANON_KEY;
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || PLACEHOLDER_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
