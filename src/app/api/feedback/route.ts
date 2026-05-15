import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const CATEGORIES = new Set(['bug', 'content', 'ai', 'safety', 'other']);
const MAX_MESSAGE = 4000;
const MAX_CONTACT = 200;
const MAX_PAGE = 500;

// Best-effort: writes are not critical to learning. Errors return a friendly
// response without leaking schema details. Schema column is checked when
// the table is missing so dev environments without the migration still
// respond gracefully.
export async function POST(req: Request) {
  let payload: { category?: unknown; message?: unknown; contact?: unknown; page?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const category = typeof payload.category === 'string' ? payload.category : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  const contactRaw = typeof payload.contact === 'string' ? payload.contact.trim() : '';
  const pageRaw = typeof payload.page === 'string' ? payload.page.trim() : '';

  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: 'Message is too long' }, { status: 400 });
  }

  // Identify the caller for rate-limiting. Logged-in users → user id;
  // anonymous → IP from the proxy headers.
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anon';
  const rlKey = user ? `feedback:user:${user.id}` : `feedback:ip:${ip}`;
  const rl = await checkRateLimit(rlKey, 5, 5 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many reports — try again later' },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSeconds) } }
    );
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.from('feedback_reports').insert({
    user_id: user?.id ?? null,
    category,
    message: message.slice(0, MAX_MESSAGE),
    contact: contactRaw ? contactRaw.slice(0, MAX_CONTACT) : null,
    page: pageRaw ? pageRaw.slice(0, MAX_PAGE) : null,
    user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null
  });

  if (error) {
    // Table missing in dev → degrade gracefully instead of 500.
    if (error.code === '42P01') {
      return NextResponse.json(
        { ok: true, stored: false, note: 'feedback_reports table not migrated' },
        { status: 202 }
      );
    }
    return NextResponse.json({ error: 'Could not save report' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
