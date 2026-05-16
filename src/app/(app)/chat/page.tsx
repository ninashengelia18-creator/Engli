'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';
import { speak, listen } from '@/lib/speech';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm Foxy. (გამარჯობა! მე ვარ ფოქსი.) What's your name? (რა გქვია?)" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(content: string) {
    if (!content.trim() || loading) return;
    const newMessages: Msg[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/ai-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, conversationId })
    });

    if (res.status === 402) {
      setNeedsUpgrade(true);
      setLoading(false);
      return;
    }
    if (res.status === 429) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'ცოტა მოიცადე და კიდევ სცადე 🦊 (Slow down, try again in a moment.)' }
      ]);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'უი! რაღაც შეცდომა მოხდა. (Oops! Something went wrong.)' }
      ]);
      setLoading(false);
      return;
    }

    const { reply, conversationId: newId } = await res.json();
    if (newId && newId !== conversationId) setConversationId(newId);
    setMessages([...newMessages, { role: 'assistant', content: reply }]);
    setLoading(false);
    // Speak only English part — strip parenthetical Georgian.
    const englishOnly = reply.replace(/\(.+?\)/g, '').trim();
    if (englishOnly) speak(englishOnly);
  }

  function handleMic() {
    if (listening || loading) return;
    setListening(true);
    listen('', (r) => {
      setListening(false);
      if (r.heard) send(r.heard);
    });
  }

  if (needsUpgrade) {
    return (
      <main className="px-6 py-12 text-center flex flex-col items-center">
        <div className="text-6xl mb-4" aria-hidden="true">🦊</div>
        <h1 className="text-xl font-extrabold mb-2">AI მასწავლებელი Premium-შია</h1>
        <p className="text-ink-light text-sm mb-6 max-w-xs">
          ფოქსისთან საუბრისთვის დაგჭირდება Premium ანგარიში
        </p>
        <a href="/upgrade" className="btn-primary inline-block">
          გახსენი Premium
        </a>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'assistant'
                ? 'max-w-[80%] p-3 rounded-2xl bg-bg-soft border-2 border-border self-start'
                : 'max-w-[80%] p-3 rounded-2xl bg-secondary text-white self-end'
            }
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="bg-bg-soft border-2 border-border self-start max-w-[60%] p-3 rounded-2xl">
            <TypingDots />
          </div>
        )}
      </div>

      <div className="border-t-2 border-border p-3 flex items-center gap-2">
        <label htmlFor="chat-input" className="sr-only">
          შეტყობინება
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Type or tap mic..."
          disabled={loading}
          className="flex-1 border-2 border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-secondary disabled:opacity-60"
        />
        <button
          onClick={handleMic}
          disabled={loading}
          aria-label={listening ? 'ვუსმენ' : 'მიკროფონი'}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 ${
            listening ? 'bg-primary animate-pulse' : 'bg-danger'
          } disabled:opacity-50`}
        >
          <Mic size={20} />
        </button>
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          aria-label="გაგზავნა"
          className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center disabled:opacity-50 shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </main>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1" aria-label="წერს...">
      <span className="w-2 h-2 rounded-full bg-ink-lighter animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-ink-lighter animate-pulse [animation-delay:120ms]" />
      <span className="w-2 h-2 rounded-full bg-ink-lighter animate-pulse [animation-delay:240ms]" />
    </span>
  );
}
