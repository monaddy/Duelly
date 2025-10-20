const fs = require('fs');
const RAW = process.env.DU_RAW_URL || '';
const SRI = process.env.DU_SRI || '';
if (!RAW || !SRI) process.exit(0);
function canon(file){
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file,'utf8');
  const reLocalTag = /<link\b[^>]*href\s*=\s*["']\s*\.?\/?assets\/theme\.css(?:\?[^"'>]*)?["'][^>]*>\s*/gim;
  html = html.replace(reLocalTag, '');
  const esc = RAW.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const reRemoteTag = new RegExp(`<link\\b[^>]*href\\s*=\\s*["']${esc}(?:\\?[^"'>]*)?["'][^>]*>\\s*`,'gim');
  html = html.replace(reRemoteTag, '');
  const preload = `<link rel="preload" href="${RAW}" as="style" integrity="${SRI}" crossorigin="anonymous">`;
  const sheet   = `<link rel="stylesheet" href="${RAW}" integrity="${SRI}" crossorigin="anonymous">`;
  if (/(<\/head>)/i.test(html)){ html = html.replace(/<\/head>/i, `  ${preload}\n  ${sheet}\n</head>`); }
  else { html = `${preload}\n${sheet}\n` + html; }
  function dedupe(rel){
    const re = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']${esc}(?:\\?[^"'>]*)?["'][^>]*>`,'gim');
    let first=true; html = html.replace(re, m => (first ? (first=false, m) : ''));
  }
  dedupe('preload'); dedupe('stylesheet');
  fs.writeFileSync(file, html, 'utf8'); return true;
}
['index.html','dist/index.html'].forEach(canon);
