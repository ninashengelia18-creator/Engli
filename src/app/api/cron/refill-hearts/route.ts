import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hearts refill cron. Wire to Vercel Cron (vercel.json) or any external
// scheduler — Supabase pg_cron also works if you'd rather schedule the
// refill_hearts_batch() RPC directly inside Postgres.
//
// Auth: requires Authorization: Bearer $CRON_SECRET. Vercel Cron sends this
// header automatically when the env var is set on the project.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc('refill_hearts_batch');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ refilled: data ?? 0, at: new Date().toISOString() });
}

// Allow POST too so a scheduler that only does POST works without changes.
export const POST = GET;
