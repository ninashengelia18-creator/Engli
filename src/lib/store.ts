'use client';
import { create } from 'zustand';
import type { Language } from './i18n';

type AppState = {
  lang: Language;
  setLang: (lang: Language) => void;

  hearts: number;
  setHearts: (h: number) => void;

  gems: number;
  setGems: (g: number) => void;

  xp: number;
  setXp: (x: number) => void;

  streak: number;
  setStreak: (s: number) => void;

  isPremium: boolean;
  setPremium: (p: boolean) => void;
};

export const useApp = create<AppState>((set) => ({
  lang: 'ka',
  setLang: (lang) => set({ lang }),

  hearts: 5,
  setHearts: (hearts) => set({ hearts }),

  gems: 0,
  setGems: (gems) => set({ gems }),

  xp: 0,
  setXp: (xp) => set({ xp }),

  streak: 0,
  setStreak: (streak) => set({ streak }),

  isPremium: false,
  setPremium: (isPremium) => set({ isPremium })
}));
