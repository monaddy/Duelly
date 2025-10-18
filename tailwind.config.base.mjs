import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  safelist: ['bg-accent','bg-accent/60','bg-surface/60','text-fg'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: '#10B3B3' },
        surface: {
          DEFAULT: '#f8fafc',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        fg: {
          DEFAULT: '#0f172a',
          light: '#334155',
          dark: '#0f172a',
        },
      },
    },
  },
  plugins: [duellyAccentPlugin, ],
}


/* DUELLY-ACCENT-PLUGIN-START */
function duellyAccentPlugin({ addUtilities, theme }) {
  function hexToRgbTriplet(hex) {
    hex = String(hex || '').trim();
    const m = hex.match(/^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
      return `${r} ${g} ${b}`;
    }
    const rbg = hex.match(/rgb[a]?\(\s*([0-9]+)[,\s]+([0-9]+)[,\s]+([0-9]+)/i);
    if (rbg) return `${rbg[1]} ${rbg[2]} ${rbg[3]}`;
    return null;
  }
  const accent = theme('colors.accent.DEFAULT') || theme('colors.accent') || '#10B3B3';
  const fg = theme('colors.fg') || '#0F172A';
  const surface = theme('colors.surface.DEFAULT') || theme('colors.surface') || null;
  const accentRGB = hexToRgbTriplet(accent) || '16 179 179';
  const fgRGB = hexToRgbTriplet(fg) || '15 23 42';
  const utils = {
    '.bg-accent': {
      '--tw-bg-opacity': '1',
      'background-color': `rgb(${accentRGB} / var(--tw-bg-opacity))`,
    },
    '.bg-accent\/60': {
      'background-color': `rgb(${accentRGB} / 0.6)`,
    },
    '.text-fg': {
      '--tw-text-opacity': '1',
      'color': `rgb(${fgRGB} / var(--tw-text-opacity))`,
    },
  };
  if (surface) {
    const sRGB = hexToRgbTriplet(surface);
    if (sRGB) {
      utils['.bg-surface\/60'] = { 'background-color': `rgb(${sRGB} / 0.6)` };
    }
  }
  addUtilities(utils);
}
/* DUELLY-ACCENT-PLUGIN-END */

