import type { Config } from 'tailwindcss';

/**
 * Design system aligned with FORVIA's brand identity:
 * electric/deep blues (#0A23CA, #29338A, #619FD8) on clean light surfaces,
 * bold geometric display type. Functional green/red/amber are kept for the
 * safety-critical compatibility verdicts.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0A23CA', // FORVIA electric blue (primary action / accent)
          dark: '#161C5B', // deep indigo (headers, depth)
          indigo: '#29338A',
          sky: '#619FD8', // light accent
          tint: '#EAEEFC', // washed blue surface
        },
        ink: {
          DEFAULT: '#0B1020',
          soft: '#1a2238',
          muted: '#5b6480',
        },
        paper: '#F5F7FD',
        line: '#E2E8F5',
        ok: { DEFAULT: '#11875a', soft: '#e7f4ee' },
        bad: { DEFAULT: '#c0382b', soft: '#fbecea' },
        warn: { DEFAULT: '#b5780b', soft: '#fbf2e0' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-archivo)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,16,32,0.04), 0 8px 24px rgba(11,16,32,0.06)',
        hero: '0 24px 64px rgba(10,35,202,0.16)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #0A23CA 0%, #29338A 60%, #161C5B 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
