# Engli — Architecture Notes for Claude Code

This is the production codebase for Engli (ენგლი), a Duolingo-style English learning app for Georgian children.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes
- **Database + Auth**: Supabase (Postgres + RLS + Auth)
- **Payments**: Stripe Subscriptions (monthly, annual, family)
- **AI**: Anthropic Claude (for AI Tutor chat)
- **Speech**: Web Speech API (TTS + STT)
- **Mobile**: Capacitor wrap (planned)
- **Hosting**: Vercel

## Project Structure
```
src/
  app/
    page.tsx                    # Landing
    sign-in/, sign-up/          # Auth pages
    auth/callback/              # OAuth callback
    (app)/                      # Authenticated app group with shared shell
      layout.tsx                # Header + bottom nav, redirects if not signed in
      learn/                    # Home with lesson path
      lesson/[id]/              # Lesson player
      chat/                     # AI tutor chat
      words/                    # Vocabulary tab
      leagues/                  # Leaderboard
      profile/                  # User profile
      upgrade/                  # Stripe checkout entry
    admin/                      # Admin/CMS — restricted by ADMIN_EMAILS env
    api/
      checkout/                 # Stripe checkout session
      stripe/webhook/           # Stripe webhooks
      ai-tutor/                 # Claude API proxy
  components/
    AppHeader.tsx, BottomNav.tsx
    lesson/                     # All lesson exercise types
  lib/
    supabase/                   # client.ts (browser), server.ts (server + service role)
    stripe.ts, speech.ts, i18n.ts, store.ts, utils.ts
  types/db.ts                   # All TypeScript types matching Supabase schema
supabase/migrations/            # Run these in order in Supabase SQL editor
```

## Key Conventions
- Server Components by default. Client components marked with `'use client'`.
- All user-facing copy is in Georgian by default; English is fallback.
- Premium gating happens in three places: lesson page (route-level), upgrade button (UI), API routes (server validation).
- RLS protects all user data — never bypass except in service-role server routes.

## Adding a New Lesson Type
1. Add the type to `ExerciseType` in `src/types/db.ts` and the corresponding data shape.
2. Add the type to the `exercise_type` CHECK constraint in a new migration.
3. Build the component in `src/components/lesson/`.
4. Wire it into `LessonPlayer.tsx` switch statement.

## Adding Content
For now, content is added via SQL in Supabase. Future work: build a rich admin UI at `/admin/lessons/new` to create lessons through forms.

## Environment Variables
See `.env.example`. Critical secrets:
- `SUPABASE_SERVICE_ROLE_KEY` — never expose to client
- `STRIPE_SECRET_KEY` — never expose to client
- `STRIPE_WEBHOOK_SECRET` — get from `stripe listen` or Stripe dashboard
- `ANTHROPIC_API_KEY` — same key as AI Whisper

## Common Workflows
- **Run dev**: `npm run dev`
- **Run typecheck**: `npm run type-check`
- **Test Stripe webhooks locally**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- **Reset DB**: re-run `supabase/migrations/20260427_initial_schema.sql` then `..._seed_data.sql`

## Known Limitations / Future Work
1. Word-bank build exercise needs drag-and-drop (currently tap-to-add)
2. Pronunciation scoring uses browser STT — for production, integrate OpenAI Whisper API
3. AI Tutor doesn't yet store conversations to `ai_conversations` table
4. Hearts don't auto-refill (need cron job or client-side timer)
5. Leagues are simplified to a single leaderboard (real Duolingo has weekly tiers)
6. Mobile app not yet wrapped with Capacitor
7. Push notifications not yet implemented
8. Offline mode not yet implemented
9. Admin CMS is read-only — needs full CRUD for lessons/exercises
10. Apple Sign In not yet wired (required for App Store)

## Architectural Decisions
- **Why Next.js + Supabase instead of Lovable?** Avoid vendor lock-in (Nina hit this with LearnEazy Lovable Cloud). Production-grade, fully owned.
- **Why JSONB for exercise data?** Different exercise types have wildly different shapes. JSONB + TypeScript discriminated union gives flexibility without bloated tables.
- **Why Capacitor instead of React Native?** Single codebase for web + iOS + Android. Same Next.js app ships everywhere.
- **Why server actions for auth flows?** Cookies and sessions work cleanest server-side with Supabase SSR.
