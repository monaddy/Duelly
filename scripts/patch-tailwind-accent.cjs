const fs = require('fs');
const path = process.argv[2] || 'tailwind.config.js';
if (!fs.existsSync(path)) { console.error('missing Tailwind config: ' + path); process.exit(2); }
let s = fs.readFileSync(path, 'utf8');

// If accent already present under extend.colors, no-op
if (/extend\s*:\s*{[\s\S]*colors\s*:\s*{[\s\S]*accent\s*:/m.test(s)) {
  console.log('accent already present'); process.exit(0);
}

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
const IND = '  ';

function insertIntoExtendColors(src) {
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
    const cOpenRel = colorsMatch.index + colorsMatch[0].length - 1;
    const cOpenAbs = (extOpen + 1) + cOpenRel;
    const accentLine = '\n' + IND.repeat(4) + "accent: { DEFAULT: '#10B3B3' },";
    return src.slice(0, cOpenAbs + 1) + accentLine + src.slice(cOpenAbs + 1);
  } else {
    const insert = '\n' + IND.repeat(3) + "colors: { accent: { DEFAULT: '#10B3B3' }, },";
    return beforeExt + insert + extContent + afterExt;
  }
}

function insertExtendUnderTheme(src) {
  const themeMatch = /theme\s*:\s*{/.exec(src);
  if (!themeMatch) return null;
  const tOpen = src.indexOf('{', themeMatch.index);
  const tClose = findMatching(src, tOpen);
  if (tClose < 0) return null;
  const before = src.slice(0, tOpen + 1);
  const content = src.slice(tOpen + 1, tClose);
  const after = src.slice(tClose);

  if (/extend\s*:\s*{/.test(content)) return insertIntoExtendColors(src);
  const insert = '\n' + IND.repeat(2) + "extend: { colors: { accent: { DEFAULT: '#10B3B3' }, }, },";
  return before + insert + content + after;
}

let out = null;
if (/extend\s*:\s*{/.test(s)) out = insertIntoExtendColors(s);
else out = insertExtendUnderTheme(s);

if (out && out !== s) {
  fs.writeFileSync(path, out, 'utf8');
  console.log('accent inserted'); process.exit(0);
} else {
  console.log('no change performed (possibly already present or non-standard config)'); process.exit(0);
}
