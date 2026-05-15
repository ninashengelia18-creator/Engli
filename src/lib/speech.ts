'use client';

// Web Speech API wrapper. Behavior notes:
//
//  * `speak()` picks the best available English voice once voices load
//    (chromium ships them asynchronously). It survives the well-known
//    Safari/iOS bug where the first speak() after page load fails silently
//    by re-trying after voiceschanged.
//  * `listen()` returns a typed result and never throws. Callers should
//    handle `error === 'no-support'` by offering a skip. Mobile Safari
//    historically did not implement webkitSpeechRecognition; on iOS the
//    user will hit the no-support branch and get a graceful fallback.
//  * Permission errors (`not-allowed`, `service-not-allowed`) surface as
//    'no-mic' so the UI can show a "let me use the microphone" prompt.

export type SpeechErrorCode =
  | 'no-support'
  | 'no-mic'
  | 'permission-denied'
  | 'no-speech'
  | 'aborted'
  | 'network'
  | 'unknown';

export type ListenResult = {
  success: boolean;
  heard: string;
  confidence?: number;
  error?: SpeechErrorCode;
};

const PREFERRED_VOICE_LANGS = ['en-US', 'en-GB', 'en-AU', 'en'];

// --- Capability detection -----------------------------------------

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// --- Voice selection ----------------------------------------------

let cachedEnglishVoice: SpeechSynthesisVoice | null = null;
let voiceListenerInstalled = false;

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Prefer "natural"/"premium" voices that browsers expose first; fall back
  // to any en-* voice.
  const englishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  if (englishVoices.length === 0) return null;

  for (const langTag of PREFERRED_VOICE_LANGS) {
    const localPreferred = englishVoices.find(
      (v) => v.lang.toLowerCase() === langTag.toLowerCase() && v.localService
    );
    if (localPreferred) return localPreferred;
    const anyPreferred = englishVoices.find(
      (v) => v.lang.toLowerCase() === langTag.toLowerCase()
    );
    if (anyPreferred) return anyPreferred;
  }
  return englishVoices[0];
}

function ensureVoiceListener() {
  if (voiceListenerInstalled || !isSpeechSynthesisSupported()) return;
  voiceListenerInstalled = true;
  cachedEnglishVoice = pickEnglishVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedEnglishVoice = pickEnglishVoice();
  };
}

export function getSelectedEnglishVoiceName(): string | null {
  ensureVoiceListener();
  return cachedEnglishVoice?.name ?? null;
}

// --- TTS -----------------------------------------------------------

type SpeakOptions = {
  lang?: 'en-US' | 'ka-GE';
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  onError?: (err: string) => void;
};

export function speak(text: string, optsOrLang?: SpeakOptions | 'en-US' | 'ka-GE') {
  if (!isSpeechSynthesisSupported() || !text) return;
  const opts: SpeakOptions =
    typeof optsOrLang === 'string' ? { lang: optsOrLang } : optsOrLang ?? {};
  const lang = opts.lang ?? 'en-US';

  ensureVoiceListener();
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Some browsers throw when speak() is called too soon after cancel()
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts.rate ?? 0.9;
  u.pitch = opts.pitch ?? 1.1;
  if (lang === 'en-US' && cachedEnglishVoice) {
    u.voice = cachedEnglishVoice;
  }
  if (opts.onEnd) u.onend = () => opts.onEnd?.();
  if (opts.onError) {
    u.onerror = (event) => {
      const err = (event as SpeechSynthesisErrorEvent).error ?? 'unknown';
      opts.onError?.(err);
    };
  }
  try {
    window.speechSynthesis.speak(u);
  } catch (err) {
    opts.onError?.(String(err));
  }
}

export function cancelSpeech() {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

// --- Speech recognition -------------------------------------------

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type ListenOptions = {
  lang?: string;
  timeoutMs?: number;
};

export function listen(
  target: string,
  callback: (r: ListenResult) => void,
  opts: ListenOptions = {}
): (() => void) | null {
  if (typeof window === 'undefined') return null;
  const SR =
    (window as unknown as { SpeechRecognition?: new () => RecognitionLike }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => RecognitionLike })
      .webkitSpeechRecognition;

  if (!SR) {
    callback({ success: false, heard: '', error: 'no-support' });
    return null;
  }

  const rec = new SR();
  rec.lang = opts.lang ?? 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  let settled = false;
  const settle = (r: ListenResult) => {
    if (settled) return;
    settled = true;
    callback(r);
  };

  const timeoutId =
    opts.timeoutMs && opts.timeoutMs > 0
      ? window.setTimeout(() => {
          try {
            rec.stop();
          } catch {
            // ignore
          }
          settle({ success: false, heard: '', error: 'no-speech' });
        }, opts.timeoutMs)
      : null;

  rec.onresult = (event: SpeechRecognitionEvent) => {
    if (timeoutId) window.clearTimeout(timeoutId);
    const alts: { text: string; confidence: number }[] = [];
    for (let i = 0; i < event.results[0].length; i++) {
      const r = event.results[0][i];
      alts.push({ text: r.transcript.toLowerCase().trim(), confidence: r.confidence });
    }
    const t = target.toLowerCase().trim();
    const matched = alts.some(
      (a) =>
        a.text === t ||
        a.text.includes(t) ||
        t.includes(a.text) ||
        levenshtein(a.text, t) <= Math.max(2, Math.floor(t.length * 0.3))
    );
    settle({
      success: matched,
      heard: alts[0]?.text ?? '',
      confidence: alts[0]?.confidence
    });
  };

  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    if (timeoutId) window.clearTimeout(timeoutId);
    const err = e.error;
    const code: SpeechErrorCode =
      err === 'no-speech'
        ? 'no-speech'
        : err === 'audio-capture'
          ? 'no-mic'
          : err === 'not-allowed' || err === 'service-not-allowed'
            ? 'permission-denied'
            : err === 'aborted'
              ? 'aborted'
              : err === 'network'
                ? 'network'
                : 'unknown';
    settle({ success: false, heard: '', error: code });
  };

  rec.onend = () => {
    if (timeoutId) window.clearTimeout(timeoutId);
    settle({ success: false, heard: '', error: 'no-speech' });
  };

  try {
    rec.start();
  } catch {
    settle({ success: false, heard: '', error: 'unknown' });
    return null;
  }
  return () => {
    try {
      rec.stop();
    } catch {
      // ignore
    }
  };
}

// --- Human-readable Georgian messages for error states ------------

export function speechErrorMessageKa(code?: SpeechErrorCode): string {
  switch (code) {
    case 'no-support':
      return 'მიკროფონი ამ ბრაუზერში არ მუშაობს — Chrome ან Edge სცადე';
    case 'permission-denied':
      return 'მიკროფონს ნებართვა სჭირდება — დაუშვი და სცადე თავიდან';
    case 'no-mic':
      return 'მიკროფონი ვერ ვიპოვე — შეამოწმე მოწყობილობა';
    case 'no-speech':
      return 'ხმა ვერ გავიგონე — სცადე ხელახლა';
    case 'network':
      return 'ინტერნეტი ცუდია — სცადე ხელახლა';
    case 'aborted':
      return 'შეჩერდა';
    default:
      return 'რაღაცა ვერ მოხერხდა — სცადე ხელახლა';
  }
}

// --- Levenshtein --------------------------------------------------

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
