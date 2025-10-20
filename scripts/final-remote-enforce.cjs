const fs = require('fs'); const path = require('path');
const RAW = process.env.DU_REMOTE_URL || ''; const SRI = process.env.DU_REMOTE_SRI || '';
const files = ['index.html', path.join('dist','index.html')].filter(f => fs.existsSync(f));

function escReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function ensureHead(html){return /<\/head>/i.test(html)?html:`<head></head>\n${html}`;}
function removeLocalLinks(html){
  // Remove any local theme.css link tags (multi-line safe)
  html = html.replace(/<link\b[^>]*href\s*=\s*["']\s*\.?\/?assets\/theme\.css[^"'>]*["'][^>]*>\s*/gi,'');
  // Remove HTML comments that mention assets/theme.css
  html = html.replace(/<!--[\s\S]*?assets\/theme\.css[\s\S]*?-->\s*/gi,'');
  return html;
}
function removeRemoteLinks(html, url){
  const re = new RegExp(`<link\\b[^>]*href\\s*=\\s*["']${escReg(url)}[^"'>]*["'][^>]*>\\s*`,'gi');
  return html.replace(re,'');
}
function injectRemote(html, url, sri){
  const preload = `  <link rel="preload" href="${url}" as="style" crossorigin="anonymous"${sri?` integrity="${sri}"`:''}>`;
  const css     = `  <link rel="stylesheet" href="${url}" crossorigin="anonymous"${sri?` integrity="${sri}"`:''}>`;
  return html.replace(/<\/head>/i, `${preload}\n${css}\n</head>`);
}
for(const f of files){
  let html = fs.readFileSync(f,'utf8'); const before = html;
  html = ensureHead(html);
  html = removeLocalLinks(html);       // drop ALL local references/comments
  html = removeRemoteLinks(html, RAW); // drop ALL remote duplicates
  html = injectRemote(html, RAW, SRI); // insert a single pair with integrity
  if(html !== before){ fs.writeFileSync(f, html, 'utf8'); console.log('patched', f); }
  else { console.log('nochange', f); }
}
