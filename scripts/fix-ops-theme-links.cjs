const fs = require('fs');
const RAW = process.env.DU_RAW_URL || '';
const SRI = process.env.DU_SRI || '';
if (!RAW || !SRI) process.exit(0);
for (const f of ['index.html','dist/index.html']){
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f,'utf8');

  // 1) Remove any local theme.css link
  const reLocalTag = /<link\b[^>]*href\s*=\s*["']\s*\.?\/?assets\/theme\.css(?:\?[^"'>]*)?["'][^>]*>\s*/gim;
  html = html.replace(reLocalTag, '');

  // 2) Remove any remote link/preload that lacks correct integrity/crossorigin (will reinsert canonical)
  const esc = RAW.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const reRemoteTag = new RegExp(`<link\\b[^>]*href\\s*=\\s*["']${esc}(?:\\?[^"'>]*)?["'][^>]*>\\s*`,'gim');
  html = html.replace(reRemoteTag, (m) => {
    const okInt = new RegExp(`integrity=["']${SRI}["']`).test(m);
    const okCr  = /crossorigin=["']anonymous["']/i.test(m);
    const isPre = /rel=["']preload["']/i.test(m) && /as=["']style["']/i.test(m);
    const isSheet = /rel=["']stylesheet["']/i.test(m);
    return (okInt && okCr && (isPre || isSheet)) ? m : '';
  });

  // 3) Ensure a single canonical pair before </head> (or prepend if no head)
  const preload = `<link rel="preload" href="${RAW}" as="style" integrity="${SRI}" crossorigin="anonymous">`;
  const sheet   = `<link rel="stylesheet" href="${RAW}" integrity="${SRI}" crossorigin="anonymous">`;

  const hasPre   = new RegExp(`<link[^>]*rel=["']preload["'][^>]*href=["']${esc}`,'i').test(html);
  const hasSheet = new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["']${esc}`,'i').test(html);

  if (/(<\/head>)/i.test(html)){
    html = html.replace(/<\/head>/i, `${hasPre?'':'  '+preload+'\n'}${hasSheet?'':'  '+sheet+'\n'}</head>`);
  } else {
    html = (hasPre?'':preload+'\n') + (hasSheet?'':sheet+'\n') + html;
  }

  // 4) Deduplicate remote tags strictly (keep first of each rel)
  function dedupe(relName){
    const re = new RegExp(`<link[^>]*rel=["']${relName}["'][^>]*href=["']${esc}(?:\\?[^"'>]*)?["'][^>]*>`,'gim');
    let first=true;
    html = html.replace(re, (m)=> {
      if (first){ first=false; return m; }
      return '';
    });
  }
  dedupe('preload');
  dedupe('stylesheet');

  fs.writeFileSync(f, html, 'utf8');
  console.log('healed', f);
}
