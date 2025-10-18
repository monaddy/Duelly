/**
 * CI-safe Tailwind config used only for verification builds.
 * Does NOT import project TS/ESM modules (avoids Node import errors).
 * Keeps theme-only guarantees for: bg-accent, bg-accent/60, bg-surface/60, text-fg
 */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#10B3B3' }, // Brand Pack A1/T1—Teal 500
        surface: { DEFAULT: '#111827' }, // safe default to enable bg-surface/60
        fg: '#0F172A',                   // enables text-fg
      },
    },
  },
  plugins: [],
};
