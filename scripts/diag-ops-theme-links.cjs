const fs = require('fs');
const RAW = process.env.DU_RAW_URL || '';
const SRI = process.env.DU_SRI || '';
const f = 'dist/index.html';
let out = { exists:false };
try{
  if (fs.existsSync(f)){
    out.exists = true;
    const html = fs.readFileSync(f,'utf8');
    const esc = RAW.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const reSheet = new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["']${esc}(?:\\?[^"'>]*)?["'][^>]*>`,'i');
    const rePre   = new RegExp(`<link[^>]*rel=["']preload["'][^>]*href=["']${esc}(?:\\?[^"'>]*)?["'][^>]*as=["']style["'][^>]*>`,'i');
    const reLocal = /<link\b[^>]*href\s*=\s*["']\s*\.?\/?assets\/theme\.css(?:\?[^"'>]*)?["'][^>]*>/i;
    const reInt   = new RegExp(`integrity=["']${SRI}["']`);
    const reCross = /crossorigin=["']anonymous["']/i;

    out.hasRemoteSheet   = reSheet.test(html);
    out.hasRemotePreload = rePre.test(html);
    out.hasLocalLink     = reLocal.test(html);
    out.hasIntegrity     = reInt.test(html);
    out.hasCrossorigin   = reCross.test(html);
    out.remoteMentions   = (html.match(new RegExp(esc,'g'))||[]).length;

    // snippets
    const idx = html.search(reSheet);
    out.sheetSnippet = idx>=0 ? html.slice(Math.max(0,idx-120), idx+300) : '';
  }
}catch(e){ out.error = e.message; }
console.log(JSON.stringify(out,null,2));
