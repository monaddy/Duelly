const fs = require('fs'), path = require('path');
const RAW = process.env.DU_REMOTE_URL || '';
const SRI = process.env.DU_REMOTE_SRI || '';
const files = ['index.html', path.join('dist','index.html')].filter(f=>fs.existsSync(f));
const rmLocalTag = (h) => h.replace(
  /<link\b[\s\S]*?href\s*=\s*["']\s*\.?\/?assets\/theme\.css(?:\?[^"'>]*)?["'][\s\S]*?>\s*/gi, ''
);
const rmLocalComment = (h) => h.replace(/<!--[\s\S]*?assets\/theme\.css[\s\S]*?-->\s*/gi, '');
const rmRemoteDup = (h, url) => {
  if (!url) return h;
  const esc = url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re  = new RegExp(`<link\\b[\\s\\S]*?href\\s*=\\s*["']${esc}["'][\\s\\S]*?>\\s*`,'gi');
  return h.replace(re,'');
};
const ensureHead = (h) => /<\/head>/i.test(h) ? h : `<head></head>\n`+h;
const injectRemote = (h, url, sri) => {
  if (!url) return h;
  const tagPre = `  <link rel="preload" href="${url}" as="style" crossorigin="anonymous"${sri ? ` integrity="${sri}"`:''}>`;
  const tagCss = `  <link rel="stylesheet" href="${url}" crossorigin="anonymous"${sri ? ` integrity="${sri}"`:''}>`;
  const block  = `${tagPre}\n${tagCss}\n`;
  if (!h.includes(url)) return h.replace(/<\/head>/i, block + '</head>');
  // if already present, ensure integrity attr exists on both links
  return h.replace(new RegExp(`<link\\b([\\s\\S]*?href\\s*=\\s*["']${url}["'][\\s\\S]*?)>`, 'gi'),
                   (m, attrs)=> /integrity=/i.test(m) ? m :
                     `<link ${attrs} crossorigin="anonymous"${sri?` integrity="${sri}"`:''}>`);
};
for (const f of files) {
  let html = fs.readFileSync(f,'utf8');
  const before = html;
  html = rmLocalComment(rmLocalTag(html));
  html = ensureHead(html);
  html = rmRemoteDup(html, RAW);
  html = injectRemote(html, RAW, SRI);
  if (html !== before) {
    fs.writeFileSync(f, html, 'utf8');
    console.log('patched', f);
  } else {
    console.log('nochange', f);
  }
}
