/* DUELLY-CONFIG-WRAPPER-START (ESM v2: object export) */
import baseCfg from './tailwind.config.base.mjs';
function withDefaults(cfg) {
  const c = cfg && typeof cfg === 'object' ? { ...cfg } : {};
  c.theme = c.theme || {};
  c.theme.extend = c.theme.extend || {};
  c.theme.extend.colors = c.theme.extend.colors || {};
  if (!('accent' in c.theme.extend.colors)) c.theme.extend.colors.accent = { DEFAULT: '#10B3B3' };
  if (!('fg' in c.theme.extend.colors))     c.theme.extend.colors.fg     = '#0F172A';
  // Ensure required classes are always generated even if not in content
  const need = ['bg-accent','bg-accent/60','bg-surface/60','text-fg'];
  if (!Array.isArray(c.safelist)) c.safelist = [];
  for (const cls of need) if (!c.safelist.includes(cls)) c.safelist.push(cls);
  return c;
}
const resolvedBase = (typeof baseCfg === 'function') ? baseCfg() : (baseCfg?.default ?? baseCfg);
export default withDefaults(resolvedBase || {,
  theme: { extend: { colors: { accent: { DEFAULT: '#10B3B3' }, fg: '#0F172A', surface: { DEFAULT: '#121417' } } } }});
/* DUELLY-CONFIG-WRAPPER-END */
