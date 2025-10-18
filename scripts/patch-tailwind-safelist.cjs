const fs = require('fs');
const path = process.argv[2] || 'tailwind.config.js';
if (!fs.existsSync(path)) { console.error('missing Tailwind config: ' + path); process.exit(2); }
let s = fs.readFileSync(path, 'utf8');

const CLASSES = ["bg-accent","bg-accent/60","bg-surface/60","text-fg"];

function findRootObjectRange(str) {
  // Try "module.exports = { ... }"
  let m = /module\.exports\s*=\s*{/.exec(str);
  if (m) {
    const open = str.indexOf('{', m.index);
    return [open, matchBrace(str, open)];
  }
  // Try "export default { ... }"
  m = /export\s+default\s+{/.exec(str);
  if (m) {
    const open = str.indexOf('{', m.index);
    return [open, matchBrace(str, open)];
  }
  return null;
}
function matchBrace(str, openPos) {
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
function ensureSafelist(str) {
  const range = findRootObjectRange(str);
  if (!range) return null;
  const [open, close] = range;
  const before = str.slice(0, open + 1);
  const content = str.slice(open + 1, close);
  const after = str.slice(close);

  // Detect existing safelist array in root
  const safelistMatch = /safelist\s*:\s*\[([\s\S]*?)\]/m.exec(content);
  if (safelistMatch) {
    const arrBody = safelistMatch[1];
    let items = arrBody.split(',').map(x => x.trim().replace(/^['"]|['"]$/g,'')).filter(Boolean);
    let changed = false;
    for (const cls of CLASSES) {
      if (!items.includes(cls)) { items.push(cls); changed = true; }
    }
    if (!changed) return str; // no change
    const indent = (safelistMatch[0].match(/\n([ \t]*)[^\n]*$/) || [,'  '])[1];
    const rebuilt = 'safelist: [\n' + items.map(v=> indent + "  '" + v + "'").join(',\n') + '\n' + indent + ']';
    const newContent = content.slice(0, safelistMatch.index) + rebuilt + content.slice(safelistMatch.index + safelistMatch[0].length);
    return before + newContent + after;
  } else {
    // Insert safelist near top of root object
    const insert = "\n  safelist: ['bg-accent','bg-accent/60','bg-surface/60','text-fg'],";
    return before + insert + content + after;
  }
}

let out = ensureSafelist(s);
if (out && out !== s) {
  fs.writeFileSync(path, out, 'utf8');
  console.log('safelist ensured/updated');
} else {
  console.log('no changes needed (safelist already covers required classes or root not found)');
}
