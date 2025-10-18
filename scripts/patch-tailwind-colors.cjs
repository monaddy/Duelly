const fs = require('fs');
const path = process.argv[2] || 'tailwind.config.js';
if (!fs.existsSync(path)) { console.error('missing Tailwind config: ' + path); process.exit(2); }
let s = fs.readFileSync(path, 'utf8');

// Quick checks
const hasAccent = /extend\s*:\s*{[\s\S]*colors\s*:\s*{[\s\S]*accent\s*:/m.test(s);
const hasFg     = /extend\s*:\s*{[\s\S]*colors\s*:\s*{[\s\S]*fg\s*:/m.test(s);

function findMatching(str, openPos) {
  let depth = 0;
  for (let i = openPos; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" || ch === '"') { const q = ch; for (i++; i < str.length; i++) { if (str[i] === q && str[i-1] !== '\\') break; if (str[i] === '\\') i++; } }
    else if (ch === '/' && str[i+1] === '/') { for (i += 2; i < str.length && str[i] !== '\n'; i++) {} }
    else if (ch === '/' && str[i+1] === '*') { for (i += 2; i < str.length && !(str[i] === '*' && str[i+1] === '/'); i++) {} i++; }
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
const IND='  ';

function ensureInExtendColors(src, key, valueLine) {
  const extMatch = /extend\s*:\s*{/.exec(src);
  if (!extMatch) return null;
  const extOpen = src.indexOf('{', extMatch.index);
  const extClose = findMatching(src, extOpen);
  if (extClose < 0) return null;
  const beforeExt = src.slice(0, extOpen + 1);
  const extContent = src.slice(extOpen + 1, extClose);
  const afterExt = src.slice(extClose);

  const colorsMatch = /colors\s*:\s*{/.exec(extContent);
  if (colorsMatch) {
    // insert inside colors block (after opening brace)
    const cOpenRel = colorsMatch.index + colorsMatch[0].length - 1;
    const cOpenAbs = (extOpen + 1) + cOpenRel;
    const insertion = '\n' + IND.repeat(4) + valueLine;
    return src.slice(0, cOpenAbs + 1) + insertion + src.slice(cOpenAbs + 1);
  } else {
    // add colors block with entry
    const insertion = '\n' + IND.repeat(3) + `colors: { ${valueLine} },`;
    return beforeExt + insertion + extContent + afterExt;
  }
}

function ensureExtendExistsUnderTheme(src) {
  const themeMatch = /theme\s*:\s*{/.exec(src);
  if (!themeMatch) return null;
  const tOpen = src.indexOf('{', themeMatch.index);
  const tClose = findMatching(src, tOpen);
  if (tClose < 0) return null;
  const before = src.slice(0, tOpen + 1);
  const content = src.slice(tOpen + 1, tClose);
  const after = src.slice(tClose);
  if (/extend\s*:\s*{/.test(content)) return src;
  const insertion = '\n' + IND.repeat(2) + 'extend: { },';
  return before + insertion + content + after;
}

let out = s;

// Step 1: ensure theme.extend exists
const maybe = ensureExtendExistsUnderTheme(out);
if (maybe) out = maybe;

// Step 2: add accent if missing
if (!hasAccent) {
  const next = ensureInExtendColors(out, 'accent', "accent: { DEFAULT: '#10B3B3' },");
  if (next) out = next;
}

// Step 3: add fg if missing (minimal brand default)
if (!hasFg) {
  const next = ensureInExtendColors(out, 'fg', "fg: '#0F172A',");
  if (next) out = next;
}

if (out !== s) {
  fs.writeFileSync(path, out, 'utf8');
  console.log('patched: accent/fg ensured');
} else {
  console.log('no changes needed');
}
