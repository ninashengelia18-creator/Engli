import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Cap per-message content to keep prompts bounded.
const MAX_MESSAGES = 30;
const MAX_CONTENT_CHARS = 2000;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const out: ChatMessage[] = [];
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== 'object') return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string') return null;
    out.push({ role, content: content.slice(0, MAX_CONTENT_CHARS) });
  }
  return out;
}

function isValidUuid(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request) {
  let payload: { messages?: unknown; scenario?: unknown; conversationId?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages = sanitizeMessages(payload.messages);
  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
  }
  const scenario =
    typeof payload.scenario === 'string' ? payload.scenario.slice(0, 200) : undefined;
  const conversationId = isValidUuid(payload.conversationId) ? payload.conversationId : null;

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Per-user rate limit: 20 messages per minute. Backed by Upstash when
  // UPSTASH_REDIS_REST_URL/TOKEN are set; otherwise in-memory per process.
  const rl = await checkRateLimit(`ai-tutor:${user.id}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  // Premium gate
  const admin = createServiceRoleClient();
  const { data: sub } = await admin
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .single();
  const isPremium =
    sub?.tier !== 'free' && (sub?.status === 'active' || sub?.status === 'trialing');
  if (!isPremium) {
    return NextResponse.json({ error: 'Premium required', requiresUpgrade: true }, { status: 402 });
  }

  // Profile to inform tutoring
  const { data: profile } = await admin
    .from('profiles')
    .select('child_name, child_age')
    .eq('id', user.id)
    .single();

  const childAge = profile?.child_age ?? 8;
  const childName = profile?.child_name ?? 'student';

  const systemPrompt = `You are Foxy 🦊, a friendly English tutor for a Georgian child named ${childName} (age ${childAge}).

Rules:
- Use VERY simple English, age-appropriate vocabulary
- Speak short sentences (max 12 words per sentence)
- Always include the Georgian translation in parentheses after your English
- Format: "Hello! (გამარჯობა!) How are you? (როგორ ხარ?)"
- Encourage and praise effort: say "Great job!", "Nice!", "Well done!"
- Never correct directly — model the right answer instead
- Stay in character as a friendly fox, warm and patient
- If the child writes in Georgian, gently respond in English first then Georgian
- Current scenario: ${scenario || 'casual conversation'}
- Keep responses to 2-3 short sentences`;

  let reply: string;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages
    });
    reply = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text)
      .join('\n');
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Persist the conversation. Best-effort: a DB write failure must not break
  // the tutor reply for the child.
  const fullTranscript = [...messages, { role: 'assistant' as const, content: reply }];
  let resolvedId = conversationId;
  try {
    if (conversationId) {
      await admin
        .from('ai_conversations')
        .update({ messages: fullTranscript, scenario: scenario ?? null })
        .eq('id', conversationId)
        .eq('user_id', user.id);
    } else {
      const { data: inserted } = await admin
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          scenario: scenario ?? null,
          messages: fullTranscript
        })
        .select('id')
        .single();
      resolvedId = inserted?.id ?? null;
    }
  } catch {
    // swallow — chat must still respond
  }

  return NextResponse.json({ reply, conversationId: resolvedId });
}
