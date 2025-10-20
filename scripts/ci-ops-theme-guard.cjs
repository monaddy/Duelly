const fs = require('fs');
const RAW = process.env.DU_RAW_URL || '';
const SRI = process.env.DU_SRI || '';
const INDEX = 'dist/index.html';

let exists=false, hasSheet=false, hasPre=false, okIntegrity=false, noLocal=true, reasons=[];
if (fs.existsSync(INDEX)) {
  exists = true;
  const html = fs.readFileSync(INDEX,'utf8');

  const esc = RAW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  noLocal = !/href\s*=\s*["']\s*\.?\/?assets\/theme\.css/i.test(html);
  if (!noLocal) reasons.push('local_link_present');

  const reHref = new RegExp(`href\\s*=\\s*["']${esc}(?:\\?[^"'>]*)?["']`, 'i');
  const reSheet = new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*${reHref.source}[^>]*>`, 'i');
  const rePre   = new RegExp(`<link[^>]*rel=["']preload["'][^>]*${reHref.source}[^>]*as=["']style["'][^>]*>`, 'i');

  hasSheet = reSheet.test(html);
  if (!hasSheet) reasons.push('missing_remote_stylesheet');

  hasPre = rePre.test(html); // אינפורמטיבי

  // SRI: בדיקה ע"י includes (מכסה גם ' וגם ")
  const links = html.match(new RegExp(`<link[^>]*${reHref.source}[^>]*>`, 'gi')) || [];
  okIntegrity = links.some(tag =>
    tag.includes(`integrity="${SRI}"`) || tag.includes(`integrity='${SRI}'`)
  );
  if (!okIntegrity) reasons.push('integrity_mismatch_or_missing');
} else {
  reasons.push('dist_index_missing');
}

const pass = exists && hasSheet && okIntegrity && noLocal;
const out = { exists, hasSheet, hasPre, okIntegrity, noLocal, pass, reasons };
console.log(JSON.stringify(out, null, 2));
process.exit(pass ? 0 : 1);
