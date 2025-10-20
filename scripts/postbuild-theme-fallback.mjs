import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distIndex = path.resolve(__dirname, '../dist/index.html');
const srcIndex  = path.resolve(__dirname, '../index.html');
const RAW_URL   = process.env.DUELLY_REMOTE_THEME_URL || 'https://raw.githubusercontent.com/monaddy/Duelly/ops/assets/dist/assets/theme.css';
const rmLocal = (html) =>
  html.replace(/<link\b[^>]*href=(["'])[^"'<>]*assets\/theme\.css(?:\?[^"'<>]*)?\1[^>]*>\s*/gi, '');
const ensureRemote = (html) => {
  if (html.includes(RAW_URL)) return html;
  const tag = `  <link rel="preload" href="${RAW_URL}" as="style">\n  <link rel="stylesheet" href="${RAW_URL}">\n`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, tag + '</head>');
  return tag + html;
};
const patch = (p) => {
  if (!fs.existsSync(p)) return false;
  let h = fs.readFileSync(p, 'utf8'); const before = h;
  h = rmLocal(h); h = ensureRemote(h);
  if (h !== before) fs.writeFileSync(p, h, 'utf8');
  return true;
};
try { patch(srcIndex); patch(distIndex); console.log('[postbuild-theme-fallback] remote-only enforced'); }
catch(e){ console.log('[postbuild-theme-fallback] error:', e?.message || e); }
