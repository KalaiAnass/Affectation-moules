import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0b0d10',
          soft: '#15181d',
          muted: '#5b6470',
        },
        paper: '#f7f8fa',
        line: '#e6e8ec',
        ok: { DEFAULT: '#11875a', soft: '#e7f4ee' },
        bad: { DEFAULT: '#c0382b', soft: '#fbecea' },
        warn: { DEFAULT: '#b5780b', soft: '#fbf2e0' },
        accent: '#2b6cff',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)',
        hero: '0 24px 64px rgba(16,24,40,0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
