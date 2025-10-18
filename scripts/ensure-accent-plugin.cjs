const fs = require('fs');
const path = process.argv[2] || 'tailwind.config.js';
let s = fs.readFileSync(path, 'utf8');

function findRoot(str){
  let m = /module\.exports\s*=\s*{/.exec(str);
  if (m){ const open = str.indexOf('{', m.index); return [open, match(str, open)]; }
  m = /export\s+default\s+{/.exec(str);
  if (m){ const open = str.indexOf('{', m.index); return [open, match(str, open)]; }
  // defineConfig(...) variant
  m = /export\s+default\s+defineConfig\s*\(/.exec(str);
  if (m){ const open = str.indexOf('{', m.index); return [open, match(str, open)]; }
  return null;
}
function match(str, open){
  let d=0;
  for (let i=open;i<str.length;i++){
    const ch=str[i];
    if (ch==="'"||ch===`"`) { const q=ch; for(i++;i<str.length;i++){ if(str[i]===q && str[i-1] !== '\\') break; if (str[i]==='\\') i++; } }
    else if (ch==='/' && str[i+1]==='/'){ for(i+=2;i<str.length && str[i] !== '\n'; i++){} }
    else if (ch==='/' && str[i+1]==='*'){ for(i+=2;i<str.length && !(str[i]==='*' && str[i+1]==='/'); i++){} i++; }
    else if (ch==='{') d++;
    else if (ch==='}') { d--; if (d===0) return i; }
  }
  return -1;
}
const PLUGIN_FUNC = `
/* DUELLY-ACCENT-PLUGIN-START */
function duellyAccentPlugin({ addUtilities, theme }) {
  function hexToRgbTriplet(hex) {
    hex = String(hex || '').trim();
    const m = hex.match(/^#?([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
      return \`\${r} \${g} \${b}\`;
    }
    const rbg = hex.match(/rgb[a]?\\(\\s*([0-9]+)[,\\s]+([0-9]+)[,\\s]+([0-9]+)/i);
    if (rbg) return \`\${rbg[1]} \${rbg[2]} \${rbg[3]}\`;
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
      'background-color': \`rgb(\${accentRGB} / var(--tw-bg-opacity))\`,
    },
    '.bg-accent\\/60': {
      'background-color': \`rgb(\${accentRGB} / 0.6)\`,
    },
    '.text-fg': {
      '--tw-text-opacity': '1',
      'color': \`rgb(\${fgRGB} / var(--tw-text-opacity))\`,
    },
  };
  if (surface) {
    const sRGB = hexToRgbTriplet(surface);
    if (sRGB) {
      utils['.bg-surface\\/60'] = { 'background-color': \`rgb(\${sRGB} / 0.6)\` };
    }
  }
  addUtilities(utils);
}
/* DUELLY-ACCENT-PLUGIN-END */
`;

if (!s.includes('DUELLY-ACCENT-PLUGIN-START')) {
  s += '\n' + PLUGIN_FUNC + '\n';
}

const root = findRoot(s);
if (!root) {
  // If we can't find the root object, just append a minimal export wrapper that uses the plugin
  if (!/export\s+default|module\.exports/.test(s)) {
    s += `\nmodule.exports = { plugins: [duellyAccentPlugin] };\n`;
  } else {
    // Fallback: append a harmless no-op; user can integrate manually
    s += `\n// DUELLY: unable to locate root config object to inject plugins array.\n`;
  }
} else {
  const [open, close] = root;
  const before = s.slice(0, open + 1);
  const body = s.slice(open + 1, close);
  const after = s.slice(close);
  if (/plugins\s*:\s*\[/.test(body)) {
    if (!/duellyAccentPlugin/.test(body)) {
      const newBody = body.replace(/plugins\s*:\s*\[/, m => m + 'duellyAccentPlugin, ');
      s = before + newBody + after;
    }
  } else {
    // Insert plugins near top of the root object
    const insert = `\n  plugins: [duellyAccentPlugin],`;
    s = before + insert + body + after;
  }
}

fs.writeFileSync(path, s, 'utf8');
console.log('accent plugin ensured');
