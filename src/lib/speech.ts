'use client';

export function speak(text: string, lang: 'en-US' | 'ka-GE' = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

export type ListenResult = {
  success: boolean;
  heard: string;
  error?: 'no-support' | 'no-mic' | 'no-speech' | 'aborted' | 'unknown';
};

export function listen(target: string, callback: (r: ListenResult) => void): (() => void) | null {
  if (typeof window === 'undefined') return null;
  const SR =
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition })
      .webkitSpeechRecognition;

  if (!SR) {
    callback({ success: false, heard: '', error: 'no-support' });
    return null;
  }

  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  rec.onresult = (event: SpeechRecognitionEvent) => {
    const alts: string[] = [];
    for (let i = 0; i < event.results[0].length; i++) {
      alts.push(event.results[0][i].transcript.toLowerCase().trim());
    }
    const t = target.toLowerCase().trim();
    const matched = alts.some(
      (a) =>
        a === t ||
        a.includes(t) ||
        t.includes(a) ||
        levenshtein(a, t) <= Math.max(2, Math.floor(t.length * 0.3))
    );
    callback({ success: matched, heard: alts[0] || '' });
  };

  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    const err = e.error;
    callback({
      success: false,
      heard: '',
      error:
        err === 'no-speech'
          ? 'no-speech'
          : err === 'audio-capture'
            ? 'no-mic'
            : err === 'aborted'
              ? 'aborted'
              : 'unknown'
    });
  };

  rec.onend = () => {};
  rec.start();
  return () => rec.stop();
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}
