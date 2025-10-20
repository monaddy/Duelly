#!/usr/bin/env bash
# FE UI Build Rescue (workclone v5): Pixi-aware UI fixes + tsconfig DOM/Node + TSC/Build/TW verify + ChatOps
set -Eeuo pipefail
STEP_ID="093-fe-ui-build-rescue-workclone-v5"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"; mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/$STEP_ID-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='$STEP_ID' status=error time=$(date -Is) code=$c log='$LOG_FILE' notes=\"build rescue failed (v5)\""; exit $c' ERR

SRC_REPO="/root/backgammon-mini-app"
cd "$SRC_REPO" || { echo "[ERR] missing repo dir $SRC_REPO"; exit 10; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"
[ -n "$ORIGIN_URL" ] || { echo "[ERR] missing git remote 'origin'"; exit 20; }

BRANCH="${BRANCH:-duelly/theme-preview-20251018-211622}"

ts=$(date +%Y%m%d-%H%M%S)
WORK="$TMP_DIR/ui-build-rescue-v5-$ts"
echo "[CTX] origin=$ORIGIN_URL branch=$BRANCH work=$WORK"
git clone "$ORIGIN_URL" "$WORK"
cd "$WORK"
git config user.email >/dev/null 2>&1 || git config user.email "fe-bot@duelly.local"
git config user.name  >/dev/null 2>&1 || git config user.name  "FE Bot"
git fetch origin -q || true
git checkout -B "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" origin/main || git checkout -B "$BRANCH"

# === PIXI major detection ===
node - <<'NODE'
const fs=require('fs');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const pick=(o,k)=>o&&o[k];
const ver=pick(pkg.dependencies,'pixi.js')||pick(pkg.dependencies,'@pixi/app')||pick(pkg.devDependencies,'pixi.js')||pick(pkg.devDependencies,'@pixi/app')||'7.0.0';
const m=/(\d+)/.exec(ver.replace(/^[^\d]*/,''));
const major=m?parseInt(m[1],10):7;
fs.writeFileSync('.pixi-major',''+major);
console.log('[PIXI] detected major=',major,'from version',ver);
NODE
PIXI_MAJOR="$(cat .pixi-major 2>/dev/null || echo 7)"

# === UI fixes (Pixi/FpsOverlay/Game/fairness) ===
node - <<'NODE'
const fs=require('fs'); function patch(p, fn){ if(!fs.existsSync(p)) return console.log('[SKIP]',p,'not found'); const s=fs.readFileSync(p,'utf8'); const t=fn(s); if(t!==s){ fs.writeFileSync(p,t); console.log('[PATCH]',p); } else { console.log('[OK]',p,'no change'); } }
const major=+(fs.readFileSync('.pixi-major','utf8').trim()||'7');

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

patch('src/components/PixiBoard.tsx', s=>{
  let t=s;
  // emit drag
  t=t.replace(/socket\?\.\s*emit\(\s*['"]moveAttempt['"]\s*,[\s\S]*?from\s*:\s*idx[\s\S]*?\);\s*/m,
`if (!dest) return;
const to: number | 'bar' | 'bearoff-white' | 'bearoff-black' = dest.type === 'point' ? dest.idx : dest.type;
socket?.emit('moveAttempt', { from: idx, to });
`);
  // emit tap
  t=t.replace(/socket\?\.\s*emit\(\s*['"]moveAttempt['"]\s*,[\s\S]*?from\s*:\s*tapSelection\.origin[\s\S]*?\);\s*/m,
`if (!dest) return;
const to: number | 'bar' | 'bearoff-white' | 'bearoff-black' = dest.type === 'point' ? dest.idx : dest.type;
socket?.emit('moveAttempt', { from: tapSelection.origin, to });
`);
  // polygon -> drawPolygon
  t=t.replace(/\.polygon\(/g,'.drawPolygon(');
  // pointer api
  if (major >= 7) {
    t=t.replace(/([A-Za-z_$][\w$]*)\.buttonMode\s*=\s*true\s*;/g, (_m,g)=> `${g}.eventMode = 'static'; ${g}.cursor = 'pointer';`);
  } else {
    // v6: הסר eventMode/cursor שהוזרקו בעבר והפעל buttonMode+interactive
    t=t.replace(/([A-Za-z_$][\w$]*)\.eventMode\s*=\s*['"][^'"]+['"]\s*;\s*([A-Za-z_$][\w$]*)\.cursor\s*=\s*['"][^'"]+['"]\s*;?/g, '');
    if (!/\.interactive\s*=\s*true/.test(t)) t = t.replace(/(new\s+Graphics\(\)\s*;)/, `$1\n  g.interactive = true;`);
    if (!/\.buttonMode\s*=\s*true/.test(t)) t += `\n  g.buttonMode = true;`;
  }
  // destroy
  t=t.replace(/app\.destroy\(\s*true\s*,\s*\{\s*children\s*:\s*true[\s\S]*?\}\s*\)\s*;/g,`app.stage.destroy({ children: true });\n          app.destroy(true);`);
  // background
  if (major >= 7) {
    t=t.replace(/g\.roundRect\(\s*0\s*,\s*0\s*,\s*BOARD_W\s*,\s*BOARD_H\s*,\s*20\s*\)\.fill\(\s*\{\s*color:\s*0x([0-9a-fA-F]+)\s*\}\s*(?:as\s*any\s*)?\)\)?\s*;?/g,`g.roundRect(0, 0, BOARD_W, BOARD_H, 20).fill(0x$1);`);
  } else {
    t=t.replace(/g\.roundRect\(\s*0.*?fill\([^)]*\)\s*;?/g,
`g.beginFill(0x0d1117);
g.drawRoundedRect(0, 0, BOARD_W, BOARD_H, 20);
g.endFill();`);
  }
  return t;
});

patch('src/routes/Game.tsx', s=> s.replace(/setState\(\s*s\s*\)\s*;/, 'if (s) { setState(s); }'));

patch('src/utils/fairness.ts', s=>{
  if(!/subtle\.sign/.test(s)) return s;
  return s
    .replace(/crypto\.subtle\.sign\(\s*['"]HMAC['"]\s*,\s*key\s*,\s*data\s*\)/, `crypto.subtle.sign({ name: 'HMAC' }, key, (typeof data==='string' ? new TextEncoder().encode(data) : data as Uint8Array))`)
    .replace(/new Uint8Array<ArrayBufferLike>/g,'new Uint8Array');
});
NODE

# === Tailwind colors ensure (accent/fg/surface) ===
CFG="$(ls -1 tailwind.config.cjs tailwind.config.js tailwind.config.mjs 2>/dev/null | head -n1 || true)"
if [ -n "$CFG" ]; then
  CFG_FILE="$CFG" node - <<'NODE'
const fs=require('fs'); const p=process.env.CFG_FILE; const s0=fs.readFileSync(p,'utf8');
function blk(src, start, key){ const re=new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:\\s*\\{','g'); re.lastIndex=start||0; const m=re.exec(src); if(!m) return null; let i=m.index+m[0].length-1,d=0,str=false,q=''; let st=i; for(let j=i;j<src.length;j++){const ch=src[j]; if(str){ if(ch==='\\') {j++;continue;} if(ch===q) str=false; continue;} if(ch=='"'||ch=="'"||ch=='`'){str=true;q=ch;continue;} if(ch=='{'){ if(d===0) st=j; d++; continue;} if(ch=='}'){ d--; if(d===0) return {start:st,end:j};}} return null;}
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

# === tsconfig – הזרקה בטוחה של DOM/Node/ES והקלות build ===
if [ -f tsconfig.json ]; then
  TSCONF=tsconfig.json
else
  # צור בסיס מינימלי אם אין
  cat > tsconfig.json <<'JSON'
{ "compilerOptions": { "target":"ES2020","module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx","lib":["ES2020","DOM"],"types":["node"],"skipLibCheck":true,"strict":true }, "include":["src"] }
JSON
  TSCONF=tsconfig.json
fi

# עדכון זהיר של tsconfig.json (שומר קיים, מוסיף חסרים)
node - <<'NODE'
const fs=require('fs'); const f='tsconfig.json';
const j=JSON.parse(fs.readFileSync(f,'utf8'));
j.compilerOptions = Object.assign({},{ target:"ES2020", module:"ESNext", moduleResolution:"Bundler", jsx:"react-jsx",
  lib:["ES2020","DOM"], types:["node"], skipLibCheck:true }, j.compilerOptions||{});
function addUnique(arr, v){ if(!Array.isArray(arr)) return [v]; if(!arr.includes(v)) arr.push(v); return arr; }
j.compilerOptions.lib = Array.isArray(j.compilerOptions.lib)? j.compilerOptions.lib : [];
addUnique(j.compilerOptions.lib,"ES2020"); addUnique(j.compilerOptions.lib,"DOM");
j.compilerOptions.types = Array.isArray(j.compilerOptions.types)? j.compilerOptions.types : [];
addUnique(j.compilerOptions.types,"node");
fs.writeFileSync(f, JSON.stringify(j,null,2));
console.log('[PATCH] tsconfig.json updated');
NODE

# === commit + push (אם יש שינוי) ===
git add -A
if git diff --cached --quiet; then
  echo "[GIT] nothing to commit"
else
  git commit -m "fix(ui): rescue v5 — Pixi-aware patches + tsconfig DOM/Node/ES + ensure tailwind colors"
  git push -u origin "$BRANCH" || true
fi

# === התקנת תלויות ===
PKG="npm"
if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then PKG="pnpm"; fi
if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then PKG="yarn"; fi
echo "[PKG] installing with $PKG"
case "$PKG" in
  pnpm) pnpm install --frozen-lockfile || pnpm install ;;
  yarn) yarn install --frozen-lockfile || yarn install ;;
  npm)  npm ci || npm install ;;
esac

# === TSC-only triage ===
set +e
npx -y tsc -v || true
npx -y tsc --noEmit > "$TMP_DIR/tsc-$ts.out" 2>&1
TSC_RC=$?
set -e
echo "[TSC] rc=$TSC_RC out=$TMP_DIR/tsc-$ts.out"
ERRS="$(grep -o 'TS[0-9]\+' "$TMP_DIR/tsc-$ts.out" | sort | uniq -c | sort -nr | head -n 5 | tr '\n' ' ' || true)"

# === Build רגיל ===
set +e
if [ "$PKG" = "pnpm" ]; then pnpm -s build; BUILD_RC=$?
elif [ "$PKG" = "yarn" ]; then yarn -s build; BUILD_RC=$?
else npm run -s build; BUILD_RC=$?; fi
set -e
echo "[BUILD] rc=$BUILD_RC"

# === Tailwind CLI verify ===
CFG="$(ls -1 tailwind.config.cjs tailwind.config.js tailwind.config.mjs 2>/dev/null | head -n1 || true)"
TW_IN="$TMP_DIR/in-$ts.css"; TW_HTML="$TMP_DIR/in-$ts.html"; TW_OUT="$TMP_DIR/out-$ts.css"
echo '@tailwind utilities;' > "$TW_IN"
echo '<div class="bg-accent bg-accent/60 bg-surface/60 text-fg"></div>' > "$TW_HTML"
set +e
npx -y tailwindcss -c "$CFG" -i "$TW_IN" -o "$TW_OUT" --minify --content "$TW_HTML"
TW_RC=$?
set -e
echo "[TW] rc=$TW_RC cfg=$CFG out=$TW_OUT"
ACCENT_OK="no"; FG_OK="no"; SURF_OK="no"
grep -q '\.bg-accent' "$TW_OUT" && ACCENT_OK="yes" || true
grep -q '\.text-fg'   "$TW_OUT" && FG_OK="yes" || true
grep -Eq '\.bg-surface(\\\/|/)60' "$TW_OUT" && SURF_OK="yes" || true

# === החלטה ===
if [ $BUILD_RC -eq 0 ] && [ $TW_RC -eq 0 ] && [ "$ACCENT_OK" = "yes" ] && [ "$FG_OK" = "yes" ] && [ "$SURF_OK" = "yes" ]; then
  echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) log=$LOG_FILE notes=\"compile=ok tw_cli=ok pixiMajor=$PIXI_MAJOR accent=$ACCENT_OK fg=$FG_OK surface60=$SURF_OK tsc_rc=$TSC_RC tsc_top=${ERRS:-none} branch=$BRANCH out=$TW_OUT\""
else
  echo "[ERR] ----- TSC last 80 lines -----"; tail -n 80 "$TMP_DIR/tsc-$ts.out" 2>/dev/null || true
  echo "[ERR] ----- out.css last 50 lines -----"; tail -n 50 "$TW_OUT" 2>/dev/null || true
  echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=VERIFY_FAIL log=$LOG_FILE notes=\"compile=$BUILD_RC tw_cli=$TW_RC pixiMajor=$PIXI_MAJOR accent=$ACCENT_OK fg=$FG_OK surface60=$SURF_OK tsc_rc=$TSC_RC tsc_top=${ERRS:-none} branch=$BRANCH out=$TW_OUT tsc_out=$TMP_DIR/tsc-$ts.out\""
  exit 1
fi
