import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Weekly league rollover. Schedule for Monday 00:05 UTC so it runs
// just after the week boundary used by current_week_start/end.
//
// Wire to Vercel Cron via vercel.json (already added) or any external
// scheduler. Supabase pg_cron can also call rollover_leagues() directly.
//
// Auth: requires Authorization: Bearer $CRON_SECRET. Vercel Cron sends
// this header automatically when CRON_SECRET is set on the project.
async function handler(req: Request) {
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
  // Rollover the week that just ended (yesterday's end_date if cron runs
  // Monday 00:05 UTC). Passing null lets the function default to the
  // current_week_end(); we explicitly pass yesterday to be unambiguous.
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const endDate = yesterday.toISOString().slice(0, 10);

  const { data, error } = await admin.rpc('rollover_leagues', { p_end_date: endDate });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ran_for_end_date: endDate,
    result: data?.[0] ?? null,
    at: new Date().toISOString()
  });
}

export const GET = handler;
export const POST = handler;
