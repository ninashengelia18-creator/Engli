import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#58CC02', dark: '#58A700', light: '#89E219' },
        secondary: { DEFAULT: '#1CB0F6', dark: '#1899D6' },
        accent: { DEFAULT: '#FFC800', dark: '#E0AE00' },
        danger: { DEFAULT: '#FF4B4B', dark: '#C82323' },
        purple: { DEFAULT: '#CE82FF', dark: '#A560E8' },
        ink: { DEFAULT: '#3C3C3C', light: '#777777', lighter: '#AFAFAF' },
        bg: { DEFAULT: '#FFFFFF', soft: '#F7F7F7', card: '#FFFFFF' },
        border: { DEFAULT: '#E5E5E5', dark: '#BFBFBF' }
      },
      fontFamily: {
        sans: ['var(--font-din)', '-apple-system', 'system-ui', 'sans-serif'],
        georgian: ['var(--font-bpg)', '"BPG Nino Mtavruli"', 'sans-serif']
      },
      boxShadow: {
        btn: '0 4px 0 0 rgba(0,0,0,0.15)',
        'btn-active': '0 2px 0 0 rgba(0,0,0,0.15)'
      },
      animation: {
        bounce: 'bounce 0.5s ease-in-out infinite',
        pulse: 'pulse 1s ease-in-out infinite',
        wiggle: 'wiggle 0.5s ease-in-out'
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' }
        }
      }
    }
  },
  plugins: []
};
export default config;
