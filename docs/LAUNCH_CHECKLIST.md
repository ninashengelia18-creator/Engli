# Engli — Launch Readiness Checklist

A pragmatic list of every step needed to take Engli from `main` to a real
production deployment. Walk through this in order before the first
paying user signs up.

## 0. Pre-flight

- [ ] Branch protection on `main` (require PR + green CI before merge)
- [ ] Repo secrets reviewed — no real credentials in commit history
- [ ] `npm ci && npm run type-check && npm run lint && npm run build`
      passes locally
- [ ] CI green on the latest commit (`.github/workflows/ci.yml`)

## 1. Supabase

- [ ] Production project created at supabase.com
- [ ] Run every migration in `supabase/migrations/` in filename order
      (or `npm run migrate` with `SUPABASE_DB_URL` set)
- [ ] Verify RLS is **on** for every table (`select tablename, rowsecurity
      from pg_tables where schemaname = 'public';`)
- [ ] Auth → Providers: enable Email + Password and Google OAuth
- [ ] Auth → URL Configuration: add `https://<your-domain>/auth/callback`
- [ ] Auth → Email templates translated to Georgian (optional but nice)
- [ ] Storage → buckets reviewed (none required for launch)
- [ ] Database → backups enabled (daily, 7-day retention is fine to start)

## 2. Stripe

- [ ] Live-mode account verified
- [ ] Create products in **live** mode:
  - `Premium Monthly` — ₾29 / month
  - `Premium Annual` — ₾174 / year
  - `Family Monthly` — ₾49 / month
- [ ] Each product has a **7-day free trial** configured at the price level
- [ ] Copy live price IDs into Vercel env (`STRIPE_PRICE_MONTHLY`, etc.)
- [ ] Webhook endpoint added: `https://<your-domain>/api/stripe/webhook`
      subscribed to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] `STRIPE_WEBHOOK_SECRET` copied from the live webhook into Vercel env
- [ ] Customer Portal enabled in Stripe → Settings → Billing → Customer
      portal, with cancel + payment method update allowed
- [ ] Smoke test a real ₾1 purchase, then refund it from the dashboard

## 3. Vercel

- [ ] Project linked to the GitHub repo
- [ ] Production branch = `main`
- [ ] Custom domain assigned, HTTPS active
- [ ] Environment variables set for **Production**, **Preview**, and
      **Development** scopes (see `.env.example` — every variable there
      should be defined in Production):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_FAMILY`
  - `ANTHROPIC_API_KEY`
  - `NEXT_PUBLIC_APP_URL` (the live origin, no trailing slash)
  - `ADMIN_EMAILS` (comma-separated list)
  - `CRON_SECRET` (long random string)
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional)
- [ ] Function region matches Supabase region (`fra1` / `eu-central-1` if
      Supabase is in Frankfurt)

## 4. Cron jobs

Engli has one critical cron: hearts refill. Pick **one** mechanism:

- **Vercel Cron** — add to `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/cron/refill-hearts", "schedule": "0 * * * *" }] }
  ```
  Vercel sends a `Authorization: Bearer <CRON_SECRET>` header automatically
  when the env var is set; the route already checks this.
- **External pinger** (cron-job.org, GitHub Actions, etc.) hitting the
  same URL with the `Authorization: Bearer $CRON_SECRET` header.

Verify after first run: rows in `analytics_events` with `name='cron.refill_hearts'`.

## 5. Upstash (optional but recommended)

The AI tutor and feedback endpoint both rate-limit via `src/lib/rate-limit.ts`.
Without Upstash the limiter falls back to in-memory, which on Vercel is
per-lambda and so effectively very loose.

- [ ] Create an Upstash Redis instance in the same region as Vercel
- [ ] Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into
      Vercel env (Production)
- [ ] Confirm `isUpstashConfigured()` returns true via the admin
      analytics dashboard

## 6. AI tutor (Anthropic)

- [ ] `ANTHROPIC_API_KEY` set in Production
- [ ] Usage limits configured in the Anthropic console
- [ ] Budget alert set (e.g. notify at $25 / day)

## 7. Mobile builds (Capacitor)

The web app is the source of truth. Capacitor wraps it for iOS/Android.

- [ ] `npx cap sync` after each deploy that changes static assets
- [ ] iOS: `ios/` excluded from git, regenerate via `npx cap add ios`
      when starting an Apple build
- [ ] App Store: Apple Sign In required — see the README "Known
      Limitations" section before submission
- [ ] Android: `android/` similarly regenerated; Play Console listing
      points to Georgian default locale
- [ ] App Store / Play privacy questionnaire matches `/privacy` page

## 8. Marketing & info pages

These ship with PR #6 and need a once-over before launch:

- [ ] `/privacy` — replace template language with real legal review
- [ ] `/terms` — same
- [ ] `/safety` — confirm AI safety claims still match deployed config
- [ ] `/parent-guide` — proofread Georgian copy with a parent
- [ ] `/about-ai` — same
- [ ] `/help` — verify every FAQ is accurate post-launch
- [ ] `/contact` — set `support@engli.app` MX records or replace with
      a working address

## 9. Observability

- [ ] Set up an uptime probe on `https://<domain>/api/health` (TODO:
      add a health route in a follow-up PR)
- [ ] Configure Vercel log drain → email/Slack for 5xx spikes
- [ ] Verify `analytics_events` table grows during first day; nothing
      should depend on it but it's the first place to look for issues

## 10. First-day playbook

When the first real user signs up:

1. Watch `analytics_events` for `signup`, `lesson_completed`,
   `subscription_started`.
2. Watch `feedback_reports` for `category='safety'` or `'ai'` —
   triage within 24 h.
3. Stripe → Payments dashboard — confirm webhook deliveries are 200.
4. Supabase → Logs → API — scan for 5xx and slow queries.
5. If anything is on fire: roll back via Vercel → Deployments → Promote
   previous build.

## 11. Day-2 follow-ups (not blockers)

- Achievement reset/repair tooling
- Push notifications (web + native)
- Offline mode for review words
- Hearts auto-refill UI countdown
- Apple Sign In wiring
- Admin moderation UI for `feedback_reports`
