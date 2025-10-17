import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--tg-bg, #0b0d10)',
        fg: 'var(--tg-fg, #e5e7eb)',
        muted: 'var(--tg-muted, #9ca3af)',
        accent: 'var(--tg-accent, #22d3ee)',
        danger: 'var(--tg-danger, #ef4444)',
        surface: 'var(--tg-surface, #111827)'
      },
      boxShadow: { focus: '0 0 0 3px var(--tg-accent, #22d3ee)' }
    }
  },
  plugins: []
} satisfies Config;
