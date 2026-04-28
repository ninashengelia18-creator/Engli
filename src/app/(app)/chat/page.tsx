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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(content: string) {
    if (!content.trim()) return;
    const newMessages: Msg[] = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/ai-tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    });

    if (res.status === 402) {
      setNeedsUpgrade(true);
      setLoading(false);
      return;
    }

    const { reply } = await res.json();
    setMessages([...newMessages, { role: 'assistant', content: reply }]);
    setLoading(false);
    // Speak only English part
    const englishOnly = reply.replace(/\(.+?\)/g, '').trim();
    speak(englishOnly);
  }

  function handleMic() {
    setListening(true);
    listen('', (r) => {
      setListening(false);
      if (r.heard) send(r.heard);
    });
  }

  if (needsUpgrade) {
    return (
      <main className="px-6 py-12 text-center">
        <div className="text-6xl mb-4">🦊</div>
        <h1 className="text-xl font-extrabold mb-2">AI მასწავლებელი Premium-შია</h1>
        <p className="text-ink-light text-sm mb-6">
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] p-3 rounded-2xl ${
              m.role === 'assistant'
                ? 'bg-bg-soft border-2 border-border self-start'
                : 'bg-secondary text-white self-end ml-auto'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="bg-bg-soft border-2 border-border self-start max-w-[60%] p-3 rounded-2xl">
            <span className="text-sm">...</span>
          </div>
        )}
      </div>

      <div className="border-t-2 border-border p-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Type or tap mic..."
          className="flex-1 border-2 border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-secondary"
        />
        <button
          onClick={handleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${
            listening ? 'bg-primary animate-pulse' : 'bg-danger'
          }`}
        >
          <Mic size={20} />
        </button>
        <button onClick={() => send(input)} className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center">
          <Send size={18} />
        </button>
      </div>
    </main>
  );
}
