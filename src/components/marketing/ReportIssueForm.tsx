'use client';

import { useState } from 'react';

type Category = 'bug' | 'content' | 'ai' | 'safety' | 'other';

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'bug', label: 'შეცდომა / ბაგი' },
  { value: 'content', label: 'გაკვეთილის შინაარსი' },
  { value: 'ai', label: 'AI მასწავლებლის პრობლემა' },
  { value: 'safety', label: 'ბავშვის უსაფრთხოება' },
  { value: 'other', label: 'სხვა' }
];

const MAX_MESSAGE = 4000;

export default function ReportIssueForm() {
  const [category, setCategory] = useState<Category>('bug');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError('აღწერა აუცილებელია');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim().slice(0, MAX_MESSAGE),
          contact: contact.trim() || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setError(body.error ?? 'ვერ გავგზავნე — სცადე მოგვიანებით');
        return;
      }
      setStatus('ok');
      setMessage('');
      setContact('');
    } catch {
      setStatus('error');
      setError('ქსელის შეცდომა — სცადე მოგვიანებით');
    }
  }

  if (status === 'ok') {
    return (
      <div className="card text-center" role="status">
        <div className="text-3xl mb-2" aria-hidden="true">💚</div>
        <p className="font-bold text-primary mb-1">გვერდი მივიღეთ!</p>
        <p className="text-xs text-ink-light">გადავხედავთ რაც შეიძლება მალე.</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="btn-secondary mt-4 text-sm px-4 py-2"
        >
          მეტი შეტყობინება
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <label className="block">
        <span className="text-xs font-bold text-ink mb-1 block">კატეგორია</span>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-bold text-ink mb-1 block">
          აღწერა <span className="text-danger">*</span>
        </span>
        <textarea
          className="input min-h-[120px]"
          maxLength={MAX_MESSAGE}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="რა მოხდა? რა გვერდზე იყავი?"
        />
        <span className="text-xs text-ink-lighter">
          {message.length} / {MAX_MESSAGE}
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-bold text-ink mb-1 block">
          ელ.ფოსტა (არასავალდებულო)
        </span>
        <input
          type="email"
          className="input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="რომ პასუხი მოგწერო"
        />
      </label>

      {error && (
        <div className="text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="btn-primary w-full disabled:opacity-60"
      >
        {status === 'sending' ? 'ვაგზავნი...' : 'გაგზავნა'}
      </button>
    </form>
  );
}
