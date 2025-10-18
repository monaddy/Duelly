const fs = require('fs');
const path = process.argv[2] || 'tailwind.config.js';
if (!fs.existsSync(path)) { console.error('missing Tailwind config: ' + path); process.exit(2); }
let s = fs.readFileSync(path, 'utf8');

function matchBrace(str, openPos){
  let d=0;
  for(let i=openPos;i<str.length;i++){
    const ch=str[i];
    if (ch==="'"||ch===`"`) { const q=ch; for(i++;i<str.length;i++){ if(str[i]===q && str[i-1] !== '\\') break; if (str[i]==='\\') i++; } }
    else if (ch==='/' && str[i+1]==='/'){ for(i+=2;i<str.length && str[i] !== '\n'; i++){} }
    else if (ch==='/' && str[i+1]==='*'){ for(i+=2;i<str.length && !(str[i]==='*' && str[i+1]==='/'); i++){} i++; }
    else if (ch==='{') d++;
    else if (ch==='}') { d--; if (d===0) return i; }
  }
  return -1;
}

function insertInExtendColors(src, line){
  const ext = /extend\s*:\s*{/.exec(src);
  if (!ext) return null;
  const open = src.indexOf('{', ext.index);
  const close = matchBrace(src, open);
  if (close < 0) return null;
  const before = src.slice(0, open+1);
  const body = src.slice(open+1, close);
  const after = src.slice(close);

  const colors = /colors\s*:\s*{/.exec(body);
  if (colors) {
    const cOpenRel = colors.index + colors[0].length - 1;
    const cOpenAbs = (open+1) + cOpenRel;
    return src.slice(0, cOpenAbs+1) + '\n' + '        ' + line + src.slice(cOpenAbs+1);
  } else {
    const ins = '\n' + '      ' + 'colors: { ' + line + ' },';
    return before + ins + body + after;
  }
}

function ensureKey(src, key, def){
  const has = new RegExp('colors\\s*:\\s*{[\\s\\S]*'+key+'\\s*:').test(src);
  if (has) return src;
  const withExtend = /extend\s*:\s*{/.test(src) ? src : src.replace(/theme\s*:\s*{/, m => m + '\n    extend: { },');
  const updated = insertInExtendColors(withExtend, def);
  return updated || src;
}

let out = s;
out = ensureKey(out, 'accent', "accent: { DEFAULT: '#10B3B3' },");
out = ensureKey(out, 'fg', "fg: '#0F172A',");

// Ensure top-level safelist includes our classes (works even if CLI --content is used)
const rootStart = (() => {
  let m = /module\.exports\s*=\s*{/.exec(out); if (m) return out.indexOf('{', m.index);
  m = /export\s+default\s+{/.exec(out); if (m) return out.indexOf('{', m.index);
  return -1;
})();
if (rootStart >= 0){
  const rootEnd = matchBrace(out, rootStart);
  const before = out.slice(0, rootStart+1);
  const body = out.slice(rootStart+1, rootEnd);
  const after = out.slice(rootEnd);
  const hasSafelist = /(^|\n)\s*safelist\s*:\s*\[/.test(body);
  const needed = ["'bg-accent'","'bg-accent/60'","'bg-surface/60'","'text-fg'"];
  if (hasSafelist){
    const re = /safelist\s*:\s*\[([\s\S]*?)\]/m;
    const m = re.exec(body);
    if (m){
      const inside = m[1];
      const items = inside.split(',').map(x=>x.trim()).filter(Boolean);
      let changed=false;
      for(const n of needed) if (!items.includes(n)) { items.push(n); changed=true; }
      if (changed){
        const indent = (m[0].match(/\n([ \t]*)[^\n]*$/) || [,'  '])[1];
        const rebuilt = 'safelist: [\n' + items.map(v => indent + '  ' + v).join(',\n') + '\n' + indent + ']';
        const newBody = body.slice(0,m.index) + rebuilt + body.slice(m.index + m[0].length);
        out = before + newBody + after;
      }
    }
  } else {
    const insert = "\n  safelist: ['bg-accent','bg-accent/60','bg-surface/60','text-fg'],";
    out = before + insert + body + after;
  }
}

if (out !== s){
  fs.writeFileSync(path, out, 'utf8');
  console.log('patched: accent + fg + safelist ensured');
} else {
  console.log('no changes needed');
}
