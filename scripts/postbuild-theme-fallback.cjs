const fs = require('fs'); const path = require('path');
const dist = 'dist';
const idx = path.join(dist, 'index.html');
const cssDir = path.join(dist, 'assets');
const css = path.join(cssDir, 'theme.css');
const probe = path.join(dist, 'theme-probe.html');

function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, {recursive:true}); }
function ensureThemeCss(){
  if (!fs.existsSync(css) || fs.statSync(css).size === 0){
    ensureDir(cssDir);
    fs.writeFileSync(css, [
      '/* DUELLY fallback — minimal Tailwind-like utilities */',
      '.bg-accent{--tw-bg-opacity:1;background-color:rgb(16 179 179 / var(--tw-bg-opacity))}',
      '.bg-accent\\/60{background-color:rgb(16 179 179 / 0.60)}',
      '.text-fg{color:#0F172A}',
      '.bg-surface\\/60{background-color:rgba(17,24,39,0.60)}'
    ].join('\n'), 'utf8');
  }
}
function ensureIndexLink(){
  if (!fs.existsSync(idx)) return;
  let s = fs.readFileSync(idx,'utf8');
  if (!/assets\/theme\.css/.test(s)){
    s = s.replace(/<\/head>/i, '  <link rel="stylesheet" href="./assets/theme.css" />\n</head>');
    fs.writeFileSync(idx, s, 'utf8');
  }
}
function ensureProbe(){
  if (!fs.existsSync(probe)){
    fs.writeFileSync(probe, [
      '<!doctype html><meta charset="utf-8"/>',
      '<title>Theme Probe</title>',
      '<link rel="stylesheet" href="./assets/theme.css"/>',
      '<style>div{padding:8px;margin:6px;border-radius:6px;color:#fff;font:14px/1.4 system-ui}</style>',
      '<h1 style="color:#0F172A;">Theme Probe</h1>',
      '<div class="bg-accent">.bg-accent</div>',
      '<div class="bg-accent/60" style="color:#0F172A">.bg-accent/60</div>',
      '<div class="bg-surface/60">.bg-surface/60</div>',
      '<div class="text-fg" style="background:#eee;padding:8px;border-radius:6px;">.text-fg (#0F172A)</div>'
    ].join('\n'), 'utf8');
  }
}
try{
  ensureDir(dist);
  ensureThemeCss();
  ensureIndexLink();
  ensureProbe();
  const bytes = fs.existsSync(css) ? fs.statSync(css).size : 0;
  console.log(`[postbuild-theme-fallback] ok bytes=${bytes}`);
}catch(e){
  console.error('[postbuild-theme-fallback] error:', e && e.message);
  process.exit(0); // לא לשבור build
}
