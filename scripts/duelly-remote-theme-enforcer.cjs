const fs = require('fs'); const path = require('path');
const RAW_URL = process.env.DUELLY_REMOTE_THEME_URL;
if (!RAW_URL) process.exit(0);

const files = ['index.html', path.join('dist','index.html')].filter(p=>fs.existsSync(p));
const rmLocal = (html) => {
  // remove any <link ... href="assets/theme.css" ...>  (quotes, query, whitespace, attrs, multi-line)
  return html.replace(/<link\b[^>]*href=(["'])[^"'>]*assets\/theme\.css(?:\?[^"'>]*)?\1[^>]*>\s*/gmi, '');
};
const ensureRemote = (html) => {
  if (html.includes(RAW_URL)) return html;
  const tag = `  <link rel="preload" href="${RAW_URL}" as="style">\n  <link rel="stylesheet" href="${RAW_URL}">\n`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + '</head>');
  return tag + html;
};
for (const f of files) {
  try {
    const s = fs.readFileSync(f,'utf8'); const t = ensureRemote(rmLocal(s));
    if (t !== s) { fs.writeFileSync(f,t,'utf8'); console.log('patched', f); }
  } catch (e) { /* ignore */ }
}
