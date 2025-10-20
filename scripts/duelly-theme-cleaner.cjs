const fs = require('fs'), path = require('path');
const RAW = process.env.DUELLY_REMOTE_THEME_URL || '';
const targets = [
  path.join(process.cwd(), 'index.html'),
  path.join(process.cwd(), 'dist', 'index.html')
].filter(f => fs.existsSync(f));

const rmLocal = (html) => html.replace(
  /<link\b[\s\S]*?href\s*=\s*(["'])?\.?\/?assets\/theme\.css(?:\?[\s\S]*?)?\1[\s\S]*?>\s*/gi, ''
);

const ensureRemote = (html) => {
  if (!RAW) return html;
  if (html.includes(RAW)) return html;
  const tag = `  <link rel="preload" href="${RAW}" as="style">\n  <link rel="stylesheet" href="${RAW}">\n`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + '</head>');
  return tag + html;
};

for (const f of targets) {
  try {
    const s = fs.readFileSync(f, 'utf8');
    let t = rmLocal(s);
    t = ensureRemote(t);
    if (t !== s) {
      fs.writeFileSync(f, t, 'utf8');
      console.log('patched', f);
    } else {
      console.log('nochange', f);
    }
  } catch (e) {
    console.log('error', f, e && e.message);
  }
}
