#!/usr/bin/env bash
# FE UI Build Rescue (workclone v6): תיקוני UI + drawPolygon כהלכה + Build + אימות מחלקות מתוך dist → ChatOps
set -Euo pipefail
STEP_ID="094-fe-ui-build-rescue-workclone-v6"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"; mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/$STEP_ID-$(date +%Y%m%d-%H%M%S).log"

# לוג למסך ולקובץ; לא עוצרים על טעות — אוספים קודים ידנית
exec > >(tee -a "$LOG_FILE") 2>&1

SRC_REPO="/root/backgammon-mini-app"
cd "$SRC_REPO" || { echo "[ERR] missing repo dir $SRC_REPO"; echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=NO_REPO log=$LOG_FILE notes=\"repo missing\""; exit 1; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"
if [ -z "$ORIGIN_URL" ]; then echo "[ERR] missing git remote 'origin'"; echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=NO_ORIGIN log=$LOG_FILE notes=\"no origin\""; exit 1; fi

BRANCH="${BRANCH:-duelly/theme-preview-20251018-211622}"
ts=$(date +%Y%m%d-%H%M%S)
WORK="$TMP_DIR/ui-build-rescue-v6-$ts"
echo "[CTX] origin=$ORIGIN_URL branch=$BRANCH work=$WORK"
git clone "$ORIGIN_URL" "$WORK" || { echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=CLONE_FAIL log=$LOG_FILE notes=\"git clone failed\""; exit 1; }
cd "$WORK"
git config user.email >/dev/null 2>&1 || git config user.email "fe-bot@duelly.local"
git config user.name  >/dev/null 2>&1 || git config user.name  "FE Bot"
git fetch origin -q || true
git checkout -B "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" origin/main || git checkout -B "$BRANCH"

# זיהוי גרסת Pixi
node - <<'NODE' || true
const fs=require('fs');
try {
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  const pick=(o,k)=>o&&o[k];
  const ver=pick(pkg.dependencies,'pixi.js')||pick(pkg.dependencies,'@pixi/app')||pick(pkg.devDependencies,'pixi.js')||pick(pkg.devDependencies,'@pixi/app')||'7.0.0';
  const m=/(\d+)/.exec(ver.replace(/^[^\d]*/,''));
  const major=m?parseInt(m[1],10):7;
  fs.writeFileSync('.pixi-major',''+major);
  console.log('[PIXI] detected major=',major,'from',ver);
} catch(e){ fs.writeFileSync('.pixi-major','7'); console.log('[PIXI] default major=7'); }
NODE
PIXI_MAJOR="$(cat .pixi-major 2>/dev/null || echo 7)"

# תיקוני UI‑layer (idempotent)
node - <<'NODE' || true
const fs=require('fs');
function patch(p, fn){ if(!fs.existsSync(p)) return console.log('[SKIP]',p,'not found');
  const s=fs.readFileSync(p,'utf8'); const t=fn(s); if(t!==s){ fs.writeFileSync(p,t); console.log('[PATCH]',p); } else { console.log('[OK]',p,'no change'); } }

const major = +(fs.readFileSync('.pixi-major','utf8').trim()||'7');

// 1) FpsOverlay — cleanup ל-useEffect
patch('src/components/FpsOverlay.tsx', s=>{
  if(!/useEffect\(/.test(s)) return s;
  return s.replace(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?return\s*\(\)\s*=>\s*[^;]*;\s*\}\s*,\s*\[\s*\]\s*\);/m, ()=>{
`useEffect(() => {
  let raf = 0;
  const step = () => { try { if (typeof tick === 'function') tick(); } finally { raf = requestAnimationFrame(step); } };
  raf = requestAnimationFrame(step);
  return () => { if (raf) cancelAnimationFrame(raf); };
}, []);`
  });
});

// 2) PixiBoard — emit typed + destroy + pointer + רקע + drawPolygon תקין (array)
patch('src/components/PixiBoard.tsx', s=>{
  let t=s;

  // emit (drag)
  t=t.replace(/socket\?\.\s*emit\(\s*['"]moveAttempt['"]\s*,[\s\S]*?from\s*:\s*idx[\s\S]*?\);\s*/m,
`if (!dest) return;
const to: number | 'bar' | 'bearoff-white' | 'bearoff-black' = dest.type === 'point' ? dest.idx : dest.type;
socket?.emit('moveAttempt', { from: idx, to });
`);

  // emit (tap)
  t=t.replace(/socket\?\.\s*emit\(\s*['"]moveAttempt['"]\s*,[\s\S]*?from\s*:\s*tapSelection\.origin[\s\S]*?\);\s*/m,
`if (!dest) return;
const to: number | 'bar' | 'bearoff-white' | 'bearoff-black' = dest.type === 'point' ? dest.idx : dest.type;
socket?.emit('moveAttempt', { from: tapSelection.origin, to });
`);

  // החלפת polygon → drawPolygon + עטיפה למערכים (פונקציה drawPointTriangle)
  t=t.replace(/function\s+drawPointTriangle\s*\(\s*g\s*:\s*Graphics[\s\S]*?\)\s*\{[\s\S]*?\}/m, m=>{
    return `function drawPointTriangle(g: Graphics, x: number, y: number, w: number, h: number, color: number, isTop: boolean) {
  const ptsTop = [x, y, x + w, y, x + w / 2, y + h - 6];
  const ptsBottom = [x, y + h, x + w, y + h, x + w / 2, y + 6];
  g.beginFill(color);
  g.drawPolygon(isTop ? ptsTop : ptsBottom);
  g.endFill();
}`;
  });

  // אם נשארו קריאות drawPolygon עם פרמטרים מפורקים — עטוף למערך
  t=t.replace(/g\.drawPolygon\(\s*([^\)]*?,){3,}[^\)]*\)\s*;/g, (m)=>{
    const inner=m.slice(m.indexOf('(')+1, m.lastIndexOf(')'));
    return `g.drawPolygon([${inner}]);`;
  });

  // pointer לפי גרסה
  if (major >= 7) {
    t=t.replace(/([A-Za-z_$][\w$]*)\.buttonMode\s*=\s*true\s*;/g, (_m,g)=> `${g}.eventMode = 'static'; ${g}.cursor = 'pointer';`);
  } else {
    // v6 fallback: ensure interactive+buttonMode
    if (!/\.interactive\s*=\s*true/.test(t)) t = t.replace(/(const\s+\w+\s*=\s*new\s+Graphics\(\)\s*;)/, `$1\n  g.interactive = true;`);
    if (!/\.buttonMode\s*=\s*true/.test(t)) t += `\n  g.buttonMode = true;`;
    // הסר eventMode/cursor אם הוזרקו בעבר
    t=t.replace(/([A-Za-z_$][\w$]*)\.eventMode\s*=\s*['"][^'"]+['"]\s*;\s*([A-Za-z_$][\w$]*)\.cursor\s*=\s*['"][^'"]+['"]\s*;?/g, '');
  }

  // destroy options
  t=t.replace(/app\.destroy\(\s*true\s*,\s*\{\s*children\s*:\s*true[\s\S]*?\}\s*\)\s*;/g,`app.stage.destroy({ children: true });\n          app.destroy(true);`);

  // רקע: v7 chain או v6 begin/endFill
  t = major >= 7
    ? t.replace(/g\.roundRect\(\s*0\s*,\s*0\s*,\s*BOARD_W\s*,\s*BOARD_H\s*,\s*20\s*\)\.fill\(\s*\{\s*color:\s*0x([0-9a-fA-F]+)\s*\}\s*(?:as\s*any\s*)?\)\)?\s*;?/g,`g.roundRect(0, 0, BOARD_W, BOARD_H, 20).fill(0x$1);`)
    : t.replace(/g\.roundRect\([^)]*\)\.fill\([^)]*\)\s*;?/g,`g.beginFill(0x0d1117);\ng.drawRoundedRect(0, 0, BOARD_W, BOARD_H, 20);\ng.endFill();`);

  return t;
});

// 3) Game — guard נגד null
try {
  const p='src/routes/Game.tsx'; if (fs.existsSync(p)) {
    const s=fs.readFileSync(p,'utf8'); const t=s.replace(/setState\(\s*s\s*\)\s*;/,'if (s) { setState(s); }');
    if (t!==s) fs.writeFileSync(p,t), console.log('[PATCH]',p);
    else console.log('[OK]',p,'no change');
  } else console.log('[SKIP]',p,'not found');
} catch(e){ console.log('[WARN] Game.tsx', e.message); }

// 4) fairness — BufferSource
try {
  const p='src/utils/fairness.ts'; if (fs.existsSync(p)) {
    let s=fs.readFileSync(p,'utf8');
    s=s.replace(/crypto\.subtle\.sign\(\s*['"]HMAC['"]\s*,\s*key\s*,\s*data\s*\)/, `crypto.subtle.sign({ name: 'HMAC' }, key, (typeof data==='string' ? new TextEncoder().encode(data) : data as Uint8Array))`)
       .replace(/new Uint8Array<ArrayBufferLike>/g,'new Uint8Array');
    fs.writeFileSync(p,s); console.log('[PATCH]',p);
  } else console.log('[SKIP]',p,'not found');
} catch(e){ console.log('[WARN] fairness.ts', e.message); }
NODE

# הבטחת accent/fg/surface ב-tailwind.config.*
CFG="$(ls -1 tailwind.config.cjs tailwind.config.js tailwind.config.mjs 2>/dev/null | head -n1 || true)"
if [ -n "$CFG" ]; then
  CFG_FILE="$CFG" node - <<'NODE' || true
const fs=require('fs'); const p=process.env.CFG_FILE; const s0=fs.readFileSync(p,'utf8');
function blk(src, start, key){ const re=new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:\\s*\\{','g'); re.lastIndex=start||0; const m=re.exec(src); if(!m) return null; let i=m.index+m[0].length-1,d=0,str=false,q=''; let st=i; for(let j=i;j<src.length;j++){const ch=src[j]; if(str){ if(ch==='\\') {j++;continue;} if(ch===q) str=false; continue;} if(ch=='{'){ if(d===0) st=j; d++; continue;} if(ch=='}'){ d--; if(d===0) return {start:st,end:j};}} return null;}
let s=s0,need={accent:"accent: { DEFAULT: '#10B3B3' }",fg:"fg: '#0F172A'",surface:"surface: { DEFAULT: '#121417' }"};
let th=blk(s,0,'theme'); if(!th){ const bp=s.lastIndexOf('}'); s=s.slice(0,bp)+`,\n  theme: { extend: { colors: { ${need.accent}, ${need.fg}, ${need.surface} } } }\n`+s.slice(bp); }
else { let ex=blk(s,th.start,'extend'); if(!ex){ s=s.slice(0,th.start+1)+`\n    extend: { colors: { ${need.accent}, ${need.fg}, ${need.surface} } },`+s.slice(th.start+1); }
  else { let co=blk(s,ex.start,'colors'); if(!co){ s=s.slice(0,ex.start+1)+`\n      colors: { ${need.accent}, ${need.fg}, ${need.surface} },`+s.slice(ex.start+1); }
    else { const body=s.slice(co.start+1,co.end); const has=n=>new RegExp('(^|[,{\\n\\r\\s])\\s*'+n+'\\s*:', 'm').test(body); let add=[]; if(!has('accent')) add.push(need.accent); if(!has('fg')) add.push(need.fg); if(!has('surface')) add.push(need.surface); if(add.length){ s=s.slice(0,co.start+1)+'\n        '+add.join(', ')+','+s.slice(co.start+1); } } } }
if(s!==s0){ fs.writeFileSync(p,s); console.log('[PATCH]',p,'updated colors'); } else { console.log('[OK]',p,'colors already set'); }
NODE
else
  echo "[WARN] tailwind.config.* not found — skipping colors injection"
fi

# commit+push אם צריך
git add -A
if git diff --cached --quiet; then echo "[GIT] nothing to commit"; else git commit -m "fix(ui): build rescue v6 — drawPolygon arrays + UI patches + ensure tailwind colors"; git push -u origin "$BRANCH" || true; fi

# התקנת תלויות
PKG="npm"
if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then PKG="pnpm"; fi
if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then PKG="yarn"; fi
echo "[PKG] installing with $PKG"
if [ "$PKG" = "pnpm" ]; then pnpm install --frozen-lockfile || pnpm install
elif [ "$PKG" = "yarn" ]; then yarn install --frozen-lockfile || yarn install
else npm ci || npm install
fi

# Build
set +e
if [ "$PKG" = "pnpm" ]; then pnpm -s build; BUILD_RC=$?
elif [ "$PKG" = "yarn" ]; then yarn -s build; BUILD_RC=$?
else npm run -s build; BUILD_RC=$?
fi
set -e
echo "[BUILD] rc=$BUILD_RC"

# אימות מחלקות מתוך dist CSS (ללא npx)
DIST_CSS="$(ls -1 dist/assets/*.css 2>/dev/null | head -n1 || true)"
ACCENT_OK="no"; FG_OK="no"; SURF_OK="no"
if [ -n "$DIST_CSS" ]; then
  grep -q '\.bg-accent' "$DIST_CSS" && ACCENT_OK="yes" || true
  grep -q '\.text-fg'   "$DIST_CSS" && FG_OK="yes" || true
  grep -Eq '\.bg-surface(\\\/|/)60' "$DIST_CSS" && SURF_OK="yes" || true
else
  echo "[WARN] dist CSS not found — skipping CSS grep"
fi

# החלטה
if [ "$BUILD_RC" -eq 0 ] && [ "$ACCENT_OK" = "yes" ] && [ "$FG_OK" = "yes" ] && [ "$SURF_OK" = "yes" ]; then
  echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) log=$LOG_FILE notes=\"compile=ok classes: accent=$ACCENT_OK fg=$FG_OK surface60=$SURF_OK branch=$BRANCH pixiMajor=$PIXI_MAJOR dist_css=${DIST_CSS:-none}\""
else
  echo "[HINT] אם BUILD_RC!=0 — פתח את $LOG_FILE וחפש 'error TS' לשגיאות הקומפילציה."
  echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=VERIFY_FAIL log=$LOG_FILE notes=\"compile=$BUILD_RC classes: accent=$ACCENT_OK fg=$FG_OK surface60=$SURF_OK branch=$BRANCH pixiMajor=$PIXI_MAJOR dist_css=${DIST_CSS:-none}\""
  exit 1
fi
