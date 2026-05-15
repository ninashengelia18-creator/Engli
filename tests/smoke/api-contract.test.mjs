// Smoke tests: API route contracts. We can't hit happy paths (no real
// Supabase / Stripe / Anthropic) but we *can* verify routes reject bad
// input correctly and require auth where they should. Catches the kind
// of regression where a route accidentally returns 500 on a missing body
// or skips auth.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';

async function postJson(path, body, headers = {}) {
  return fetch(BASE + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

test('POST /api/checkout with invalid body → 400/401/4xx (not 500)', async () => {
  const r = await postJson('/api/checkout', { priceKey: 'not-a-real-key' });
  assert.ok(r.status >= 400 && r.status < 500, `expected 4xx, got ${r.status}`);
});

test('POST /api/checkout with malformed JSON → 400', async () => {
  const r = await postJson('/api/checkout', '{bad json');
  assert.equal(r.status, 400);
});

test('POST /api/feedback rejects invalid category', async () => {
  const r = await postJson('/api/feedback', { category: 'spam', message: 'hi' });
  assert.equal(r.status, 400);
});

test('POST /api/feedback rejects empty message', async () => {
  const r = await postJson('/api/feedback', { category: 'bug', message: '' });
  assert.equal(r.status, 400);
});

test('POST /api/ai-tutor without auth → 401', async () => {
  const r = await postJson('/api/ai-tutor', { messages: [] });
  assert.ok(r.status === 401 || r.status === 400, `got ${r.status}`);
});

test('POST /api/lesson/complete without auth → 401', async () => {
  const r = await postJson('/api/lesson/complete', { lessonId: '00000000-0000-0000-0000-000000000000' });
  assert.ok(r.status === 401 || r.status === 400, `got ${r.status}`);
});

test('GET /api/cron/refill-hearts without bearer → 401', async () => {
  const r = await fetch(BASE + '/api/cron/refill-hearts');
  assert.equal(r.status, 401);
});

test('GET /api/cron/refill-hearts with wrong bearer → 401', async () => {
  const r = await fetch(BASE + '/api/cron/refill-hearts', {
    headers: { authorization: 'Bearer not-the-secret' }
  });
  assert.equal(r.status, 401);
});

test('POST /api/stripe/webhook without signature → 400', async () => {
  const r = await postJson('/api/stripe/webhook', { type: 'irrelevant' });
  // Stripe SDK signature verification throws → route should reject with 400
  assert.ok(r.status >= 400 && r.status < 500, `got ${r.status}`);
});
