# Engli — ენგლი 🦊

**Sახალისო ინგლისური ქართველი ბავშვებისთვის** — A Duolingo-style English learning app for Georgian children, built by [Your Next Tutor Inc.](https://learneazy.org)

## What's in here

A complete production-grade Next.js + Supabase + Stripe + Claude AI codebase for a freemium language learning app:

- ✅ Auth (email + Google OAuth, Apple Sign In ready)
- ✅ Stripe subscriptions (monthly, annual, family tiers, 7-day trial)
- ✅ Lesson player with 4 working exercise types (Learn, Match, Speak, Build)
- ✅ Hearts, XP, gems, streaks gamification
- ✅ AI Tutor chat powered by Claude (Premium feature)
- ✅ Premium gating throughout
- ✅ Bilingual UI (Georgian primary, English secondary)
- ✅ Mobile-first responsive design (max 480px)
- ✅ PWA manifest + Capacitor config for iOS/Android
- ✅ Admin scaffold (locked to admin emails)
- ✅ Full Supabase schema with RLS

## Quick start

### 1. Install
```bash
npm install
```

### 2. Set up Supabase
1. Create new project at [supabase.com](https://supabase.com)
2. SQL Editor → run **all** migrations in `supabase/migrations/` in filename
   order, or run `npm run migrate` after setting `SUPABASE_DB_URL`.
3. Authentication → Providers → enable Google (and Apple if you want)
4. Copy URL + anon key + service role key into `.env.local`

> The `20260515_security_hardening.sql` migration replaces `award_xp` and
> `decrement_hearts` with `auth.uid()`-bound versions, adds a server-side
> `complete_lesson` RPC, and creates `processed_stripe_events` for webhook
> idempotency. Run it on any pre-existing project before deploying this
> revision — the client no longer passes `p_user_id` to those RPCs.
>
> The `20260516_hearts_refill_batch.sql` migration adds the
> `refill_hearts_batch()` service-role function used by the
> hearts-refill cron at `/api/cron/refill-hearts` (see "Cron jobs" below).
>
> The `20260517_analytics_events.sql` migration creates the
> `analytics_events` table used by the lightweight `src/lib/analytics.ts`
> client. Writes are fire-and-forget; if the table is missing the app
> still works, you'll just lose product event telemetry.
>
> The `20260518_curriculum_expansion.sql` migration adds three new
> Beginner units (food & drink, my body, school) plus an entry-level
> Intermediate world ("Everyday English"). All inserts are idempotent —
> safe to re-run.

### 3. Set up Stripe
1. [Stripe Dashboard](https://dashboard.stripe.com) → Products → create:
   - "Premium Monthly" — recurring ₾29/month
   - "Premium Annual" — recurring ₾174/year
   - "Family Monthly" — recurring ₾49/month
2. Copy the price IDs into `.env.local`
3. For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 4. Set up Anthropic
- Use the same key as AI Whisper, or create a new one at [console.anthropic.com](https://console.anthropic.com)

### 5. Run
```bash
cp .env.example .env.local
# Fill in all values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
git push origin main
# Then on vercel.com: Import → connect to repo → set env vars → deploy
```

Add Stripe webhook URL after deploy: `https://your-domain.com/api/stripe/webhook`

## Cron jobs

`vercel.json` registers two Vercel Crons, both gated by a shared secret
(`CRON_SECRET`) which Vercel Cron forwards as `Authorization: Bearer …`
automatically when the env var is set on the project. Endpoints that do
not see the secret return 503 so they can never run open.

- **Daily: `/api/cron/refill-hearts`** (04:00 UTC) — calls
  `refill_hearts_batch()` (`20260516_hearts_refill_batch.sql`), which
  refills any profile that is 4+ hours past its last refill.
- **Weekly: `/api/cron/league-rollover`** (Mon 00:05 UTC) — calls
  `rollover_leagues()` (`20260519_leagues_rollover.sql`), which computes
  final ranks for every active league cohort, promotes the top 7,
  demotes the bottom 5 (tier 2+), archives the week, and pre-seeds next
  week's leagues. The function is idempotent; firing it a second time
  on the same end_date is a no-op once leagues are archived.

> **Vercel Hobby compatibility:** Hobby plans only allow cron schedules
> that fire **at most once per day**, so the bundled `vercel.json` ships
> with a daily hearts refill (`0 4 * * *`). The weekly league rollover
> is already Hobby-safe. If you're on Vercel **Pro** (or using an
> external scheduler) and want faster hearts refills, change the
> `refill-hearts` schedule to `0 * * * *` (hourly) — the endpoint is
> idempotent and safe to hit at any cadence.

If you'd rather schedule inside Postgres, `pg_cron` can call the RPCs
directly — the HTTP endpoints become redundant in that case. External
pingers (cron-job.org, GitHub Actions scheduled workflows, etc.) also
work as long as they send `Authorization: Bearer $CRON_SECRET`.

## Rate limiting

`/api/ai-tutor` enforces a per-user 20 req/min limit. Set
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to back it with
Upstash Redis (recommended for production). Without those env vars the
limiter falls back to an in-memory per-Node-process map — fine for local
dev, "best effort" on Vercel where requests can land on different
lambdas.

## Admin CMS

`/admin` is gated by `ADMIN_EMAILS` (comma-separated). Once you're signed
in with a listed email you can:

- **Worlds / Units / Lessons** — full CRUD with slug, bilingual titles,
  emoji, premium/published toggles, and a per-record `display_order`
  that the learner-facing UI sorts by.
- **Exercises** — add Learn, Match, Listen, Speak, Build, Translate, and
  Story exercises. Each type is validated server-side before insert
  (e.g. Match's correct answer must exactly equal one of the choices,
  Build's word bank must contain every target word). Re-order with the
  up/down buttons.
- **Analytics** — `/admin/analytics` aggregates the last 14 days of
  events from `analytics_events`: DAU sparkline, lesson start/complete
  funnel, abandon rate, top lessons, exercises learners get stuck on,
  upgrade CTR, onboarding goal mix.

Service-role writes bypass RLS; admin email gating is enforced in
`src/app/admin/layout.tsx` and re-asserted at the top of every server
action in `src/app/admin/actions.ts`.

## Mobile apps

```bash
npm install -D @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init  # already done via capacitor.config.ts
npm run build && npx next export
npx cap add ios
npx cap add android
npx cap open ios     # opens Xcode
npx cap open android # opens Android Studio
```

Submit to App Store and Google Play following their standard flows.

### PWA + mobile checklist

- `public/manifest.json` declares the standalone PWA (start URL `/learn`,
  green theme, portrait, a Georgian name, and home-screen shortcuts for
  *სწავლა* and *AI მასწავლებელი*). Drop a 512×512 `icon-maskable-512.png`
  in `public/` to enable Android's maskable adaptive icon — the manifest
  already references it.
- The root layout sets `viewport-fit: cover` and the global stylesheet
  exposes `--safe-top` / `--safe-bottom` via `env(safe-area-inset-*)`.
  `AppHeader` and `BottomNav` already consume those.
- `capacitor.config.ts` sets iOS `contentInset: 'always'`, the splash
  screen background color, and `Keyboard.resize: 'native'` so the input
  field never gets covered when the on-screen keyboard appears.

### Speech / pronunciation caveats

`src/lib/speech.ts` wraps the Web Speech API:

- **TTS** prefers an installed `en-US`/`en-GB` voice and re-selects when
  the browser fires `voiceschanged` (Chromium loads voices async).
- **STT** is **not supported on iOS Safari** — `isSpeechRecognitionSupported()`
  is checked up front and the Speak exercise renders a disabled mic with
  a "Skip" button. Permission denials surface as a Georgian-language
  "let me use the microphone" prompt with a skip path. Network failures
  (which Chrome sometimes emits for offline use) are caught and
  user-visible. None of these branches block lesson progress.

## Where to put energy first

1. **Content, content, content.** The MVP has 1 fully populated lesson. You need 100 to launch.
2. **Voice recording.** Hire a Georgian-English bilingual voice actor (₾2000) — better than browser TTS for the first impression.
3. **Onboarding flow.** Add a placement quiz so kids start at the right level.
4. **Push notifications.** Duolingo's #1 retention mechanic. See `docs/push-notifications.md` (not yet written).
5. **Apple Sign In.** Required for App Store approval if you have any third-party login.

## Going to production

See [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) for an
end-to-end walkthrough of Supabase, Stripe, Vercel, Upstash, cron, AI
tutor budgets, and mobile builds.

CI runs on every PR via [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
(install · type-check · lint · build) — keep it green.

## Brand
- Name: **Engli (ენგლი)**
- Mascot: Foxy 🦊
- Primary color: #58CC02 (green)
- Tone: warm, encouraging, child-friendly, never condescending

## License
Proprietary — © Your Next Tutor Inc. All rights reserved.

---
Built with ⚡ via Claude. See `CLAUDE.md` for architecture notes.
