import { createClient } from '@/lib/supabase/server';

const FALLBACK_ADMIN_EMAILS = 'nina@learneazy.org,nina@yournexttutor.com';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? FALLBACK_ADMIN_EMAILS)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminUser() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (!adminEmails().includes(user.email.toLowerCase())) return null;
  return user;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
