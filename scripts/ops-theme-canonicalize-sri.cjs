const fs = require('fs');
const https = require('https');
const { createHash } = require('crypto');

const RAW = process.argv[2];
if (!RAW) { console.log(JSON.stringify({ok:false,error:'missing_raw_url'})); process.exit(0); }

function fetch(u){
  return new Promise((res,rej)=>{
    https.get(u, r=>{
      if (r.statusCode !== 200){ rej(new Error('HTTP '+r.statusCode)); r.resume(); return; }
      const chunks=[]; r.on('data',c=>chunks.push(c)); r.on('end',()=>res(Buffer.concat(chunks)));
    }).on('error',rej);
  });
}

(async ()=>{
  try{
    const buf = await fetch(RAW);
    const sri = 'sha256-' + createHash('sha256').update(buf).digest('base64');
    const esc = RAW.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

    const reLocal  = /<link\b[^>]*href\s*=\s*["']\s*\.?\/?assets\/theme\.css(?:\?[^"'>]*)?["'][^>]*>\s*/gim;
    const reRemote = new RegExp(`<link\\b[^>]*href\\s*=\\s*["']${esc}(?:\\?[^"'>]*)?["'][^>]*>\\s*`,'gim');

    const preload = `<link rel="preload" href="${RAW}" as="style" integrity="${sri}" crossorigin="anonymous">`;
    const sheet   = `<link rel="stylesheet" href="${RAW}" integrity="${sri}" crossorigin="anonymous">`;

    function canon(p){
      if (!fs.existsSync(p)) return false;
      let html = fs.readFileSync(p,'utf8');

      // מחיקה של לינקים ישנים/מקומיים
      html = html.replace(reLocal,'').replace(reRemote,'');

      // הזרקה לפני </head> או תחילת הקובץ
      if (/(<\/head>)/i.test(html)) {
        html = html.replace(/<\/head>/i, `  ${preload}\n  ${sheet}\n</head>`);
      } else {
        html = `${preload}\n${sheet}\n` + html;
      }

      // דה-דופליקציה: שומרים רק הופעה ראשונה של אותו rel+href
      function dedupe(rel){
        const re = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']${esc}(?:\\?[^"'>]*)?["'][^>]*>`,'gim');
        let seen=false; html = html.replace(re, m => (seen ? '' : (seen=true, m)));
      }
      dedupe('preload'); dedupe('stylesheet');

      fs.writeFileSync(p, html, 'utf8');
      return true;
    }

    const updated = { index: canon('index.html'), dist: canon('dist/index.html') };
    console.log(JSON.stringify({ ok:true, url:RAW, bytes:buf.length, sri, updated }, null, 2));
  }catch(e){
    console.log(JSON.stringify({ ok:false, error:e.message, url:RAW }, null, 2));
  }
})();
