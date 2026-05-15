# Engli — Operations & Observability Runbook

Day-two runbook for keeping Engli healthy in production. Pairs with
`docs/LAUNCH_CHECKLIST.md` — that document gets you to launch, this one
keeps you alive after.

## At-a-glance dashboard

You don't need a fancy observability stack on day one. The four surfaces
below cover ~95% of real production incidents:

| What | Where | Why it matters |
|------|-------|----------------|
| Vercel deployments | Vercel → project → Deployments | All app crashes & build failures |
| Supabase logs | Supabase → Logs Explorer | Database errors, RLS denials, auth |
| Stripe events | Stripe → Developers → Events | Webhook failures, failed payments |
| Anthropic usage | console.anthropic.com → Usage | AI Tutor cost & rate-limit posture |

Bookmark all four. If something feels off, open them in tabs left-to-right.

## Daily check (≈ 2 minutes)

1. **Vercel → Deployments** — any failed builds or 5xx spikes?
2. **Supabase → Logs Explorer** — filter `severity = error` over last 24h.
   A handful of `auth/refresh-token` errors is normal; a flood is not.
3. **Stripe → Events** — any `*.payment_failed` or webhook-retry events?
   Recover by replaying the event from the Stripe dashboard — our handler
   is idempotent (see `processed_stripe_events` table).
4. **Anthropic Usage** — current-day spend vs. expected daily envelope.

## Weekly check (≈ 10 minutes)

1. **Feedback inbox** — read every row in `feedback_reports` since last
   week. Categorize, fix anything urgent, batch the rest into a triage PR.
2. **Cron job health** — see "Cron jobs" below.
3. **Achievement drift** — verify `user_achievements` row count grew
   roughly in line with active users; a flat curve usually means a
   broken trigger or migration.
4. **Backups** — confirm latest daily backup is < 36h old in Supabase.

## Cron jobs

Engli runs two cron-style HTTP endpoints. They're authenticated with
`CRON_SECRET` (sent as `Authorization: Bearer …`).

### `/api/cron/refill-hearts`

- Cadence: hourly
- What: invokes `refill_hearts_batch()` to grant +1 heart to users whose
  `hearts < 5` and whose `hearts_refilled_at` is older than the refill
  window.
- Healthy response: `{ ok: true, refilled: <int> }` and a 200 status.
- If broken:
  - 401 → `CRON_SECRET` mismatch between Vercel env and the cron caller.
  - 500 → check Supabase logs for the RPC call; the migration
    `20260516_hearts_refill_batch.sql` must be applied.

### `/api/cron/league-rollover`

- Cadence: weekly (Monday 00:05 UTC is a safe choice).
- What: closes out last week's leaderboard tier, awards rewards, resets
  weekly XP, promotes/demotes by tier rules.
- Healthy response: 200 with a small JSON report.
- If broken: most failures are RPC-side. The Supabase logs will show the
  failing function — usually a stale migration on production.

### Configuring the schedule

Two paths, pick one:

- **Vercel Cron** (recommended): add entries to `vercel.json`. Vercel
  injects the `Authorization` header automatically when the project has
  `CRON_SECRET` set.
- **Supabase pg_cron**: call the underlying RPC directly from inside the
  database. Cuts out the HTTP hop entirely — useful if you want to keep
  the hearts refill working even when Vercel is down.

## Stripe webhooks

- Endpoint: `POST /api/stripe/webhook`
- Verification: `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.
- Idempotency: each `event.id` is recorded in the `processed_stripe_events`
  table before we mutate state. Replaying an event is safe.

**Common failure modes:**

1. *400 Missing signature* — usually means the request didn't come from
   Stripe (or the body got proxied through something that stripped the
   header). Confirm the endpoint URL is what Stripe has on file.
2. *400 Webhook error: No signatures found* — `STRIPE_WEBHOOK_SECRET` in
   Vercel doesn't match the dashboard. Rotate.
3. *Subscription status stuck on `incomplete`* — the customer never
   completed the 3DS challenge or their card was declined. Stripe will
   retry; if it stays `incomplete` after 23h Stripe gives up. Surface
   nothing to the user — they just stay on the free tier.

**Replaying an event** (for incident recovery):

1. Stripe Dashboard → Developers → Events → find the event
2. Click "Resend" → choose your webhook endpoint
3. Confirm in Supabase that `processed_stripe_events` got a new row and
   `subscriptions` reflects the new state.

## Supabase health

- **RLS** is the only thing standing between users and each other's data.
  Never write a migration that disables it. The CI workflow does not
  guard against this — it's on you to read migrations before merging.
- **Service-role usage**: only server routes in `src/app/api/**` should
  call `createServiceRoleClient()`. Client code that bypasses RLS is
  always a bug.
- **Slow queries**: Supabase → Reports → Query Performance. Anything
  over 250ms p95 deserves attention; the lesson path queries should
  fall well under that.

## AI Tutor (Anthropic)

- **Rate limiting** is enforced both via Anthropic's own per-key limit
  and a per-user limit in `src/lib/rate-limit.ts`. If you bump the
  in-app limit, also confirm the upstream key isn't a free-tier key.
- **Prompt cost discipline**: keep `MAX_MESSAGES` and `MAX_CONTENT_CHARS`
  in `src/app/api/ai-tutor/route.ts` modest. Children are happy with
  short responses; long ones cost money and are harder to keep safe.
- **Model rotation**: when Anthropic deprecates a model, update both
  the constant in the API route and the dev docs. The codebase pins a
  single model name in one place by design.

## Feedback reports

- Stored in `feedback_reports` (see `supabase/migrations`).
- Anyone can submit (logged-in or anonymous). Rate-limited per-user /
  per-IP at 5 per 5 minutes.
- Read with:
  ```sql
  select created_at, category, message, contact, page
  from feedback_reports
  order by created_at desc
  limit 50;
  ```
- Build the habit of triaging weekly. The signal-to-noise on this
  table is unusually high — most reports are real users, not bots.

## Smoke tests

- `npm run test:smoke` boots a local `next start`, then runs a
  Node-native test suite against it covering: landing, demo lesson,
  marketing pages, auth pages, anon-redirect on protected routes, and
  API contract errors.
- Runs automatically in CI (`.github/workflows/ci.yml`).
- They use **dummy** env vars — no real DB / Stripe / Anthropic calls.
  If a test starts requiring real credentials, that's a leaky test;
  redesign it.

## Incident response — first 10 minutes

1. **Confirm scope** — is it everyone (Vercel deploy bad?), one feature
   (an API route?), or one user (a session corruption issue)?
2. **Roll back** if the last deploy is the obvious culprit. Vercel →
   Deployments → "Promote to Production" on the prior good build.
3. **Disable cron** if a cron is amplifying the problem: remove the
   `CRON_SECRET` env var; the endpoints will return 503 and the
   scheduler will give up retrying after a few attempts.
4. **Communicate** — if it's user-visible, push a banner via a quick
   PR to the marketing layout or a top-level layout. Don't ship code
   you haven't read just to fix it faster.

## What we don't yet have

The following are intentional gaps, listed so future contributors
don't think they're missed:

- No Sentry / external error tracking. Vercel runtime logs + browser
  console covers our scale for now.
- No synthetic uptime monitoring. Add UptimeRobot or Better Uptime when
  paid users justify it.
- No analytics dashboard beyond the lightweight `analytics_events`
  table (`src/lib/analytics.ts`). Use a one-off SQL query in Supabase
  until volume warrants a real BI tool.
- No incident on-call rotation. There is one person on call by default:
  you.
