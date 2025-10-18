/* DUELLY-CONFIG-WRAPPER-START (ESM) */
import baseCfg from './tailwind.config.base.mjs';

function withDefaults(cfg) {
  const c = cfg || {};
  c.theme = c.theme || {};
  c.theme.extend = c.theme.extend || {};
  c.theme.extend.colors = c.theme.extend.colors || {};
  if (!('accent' in c.theme.extend.colors)) c.theme.extend.colors.accent = { DEFAULT: '#10B3B3' };
  if (!('fg' in c.theme.extend.colors))     c.theme.extend.colors.fg     = '#0F172A';
  const need = ['bg-accent','bg-accent/60','bg-surface/60','text-fg'];
  if (!Array.isArray(c.safelist)) c.safelist = [];
  for (const cls of need) if (!c.safelist.includes(cls)) c.safelist.push(cls);
  return c;
}

export default function(...args) {
  const base = (typeof baseCfg === 'function') ? baseCfg(...args) : baseCfg;
  return withDefaults(base);
}
/* DUELLY-CONFIG-WRAPPER-END */
