// Smoke tests: public marketing + auth pages should render server-side
// without auth and contain their key Georgian/English landmarks.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';

async function getHtml(path) {
  const r = await fetch(BASE + path, { redirect: 'manual' });
  const text = await r.text();
  return { status: r.status, location: r.headers.get('location'), text };
}

test('landing renders with hero, demo CTA, and pricing', async () => {
  const { status, text } = await getHtml('/');
  assert.equal(status, 200);
  assert.match(text, /ენგლი/);
  assert.match(text, /დაიწყე უფასოდ/);
  assert.match(text, /სცადე გაკვეთილი/);
  assert.match(text, /₾1/);
  assert.match(text, /href="\/demo"/);
});

test('sign-up page renders', async () => {
  const { status, text } = await getHtml('/sign-up');
  assert.equal(status, 200);
  assert.match(text, /<form|sign|რეგისტრაცია|შესვლა|ელ\.?ფოსტა|email/i);
});

test('sign-in page renders', async () => {
  const { status, text } = await getHtml('/sign-in');
  assert.equal(status, 200);
  assert.match(text, /<form|sign|შესვლა|ელ\.?ფოსტა|email/i);
});

test('demo lesson page renders (no auth)', async () => {
  const { status, text } = await getHtml('/demo');
  assert.equal(status, 200);
  assert.match(text, /სატესტო რეჟიმი|Demo/i);
});

const marketingPages = [
  ['/safety', /უსაფრთხო/],
  ['/parent-guide', /მშობელ/],
  ['/about-ai', /AI|ხელოვნური|მასწავლებ/],
  ['/help', /დახმარ|გვერდი|შეკითხვ/],
  ['/privacy', /კონფიდენციალურობა|privacy/i],
  ['/terms', /პირობებ|terms/i],
  ['/contact', /კონტაქტ|contact/i]
];

for (const [path, needle] of marketingPages) {
  test(`marketing page renders: ${path}`, async () => {
    const { status, text } = await getHtml(path);
    assert.equal(status, 200, `${path} status`);
    assert.match(text, needle, `${path} body`);
  });
}
