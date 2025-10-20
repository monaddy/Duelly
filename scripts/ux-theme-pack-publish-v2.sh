#!/usr/bin/env bash
# UX/DesignOps — Theme Pack Publisher v2 (A1/T1)
# מייצר dist/assets/theme.css ללא תלות ב-TS, מתקן npx/tailwind במידת הצורך,
# עוקף .gitignore עם git add -f, דוחף לענף ops/assets, ומדפיס RAW URL.

set -Eeuo pipefail
STEP_ID="ux-theme-pack-publish"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='${STEP_ID}' status=error time=$(date -Is) code=$c log='${LOG_FILE}' notes=\"theme pack publish failed (v2)\""; exit $c' ERR

SRC_REPO="/root/backgammon-mini-app"
cd "$SRC_REPO" || { echo "[ERR] missing repo $SRC_REPO"; exit 10; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"
[ -n "$ORIGIN_URL" ] || { echo "[ERR] missing git remote 'origin'"; exit 11; }

REPO_PATH="$(printf '%s\n' "$ORIGIN_URL" | sed -E 's#(git@|https://)github.com[:/](.*)(\.git)?#\2#')"
OWNER="$(printf '%s' "$REPO_PATH" | cut -d'/' -f1)"
REPO="$(printf '%s' "$REPO_PATH" | cut -d'/' -f2)"
RAW_URL="https://raw.githubusercontent.com/${OWNER}/${REPO}/ops/assets/dist/assets/theme.css"

ts=$(date +%Y%m%d-%H%M%S)
WORK="$TMP_DIR/theme-pack-$ts"
echo "[CTX] origin=$ORIGIN_URL work=$WORK"
git clone "$ORIGIN_URL" "$WORK"
cd "$WORK"
git config user.email >/dev/null 2>&1 || git config user.email "ux-bot@duelly.local"
git config user.name  >/dev/null 2>&1 || git config user.name  "UX Bot"

git fetch origin -q || true
if git ls-remote --exit-code --heads origin ops/assets >/dev/null 2>&1; then
  git checkout -B ops/assets origin/ops/assets
else
  git checkout -B ops/assets origin/main 2>/dev/null || git checkout -B ops/assets
fi

ASSET_CFG="tailwind.config.asset.cjs"
ASSET_IN="src/theme.css"
ASSET_CONTENT="$TMP_DIR/theme-content-$ts.html"
OUT="dist/assets/theme.css"
mkdir -p "$(dirname "$ASSET_IN")" "$(dirname "$OUT")"

# Tailwind config מינימלי + safelist
cat > "$ASSET_CFG" <<'CFG'
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./index.html",
    process.env.ASSET_CONTENT || ""
  ],
  safelist: ["bg-accent","bg-accent/60","bg-surface/60","text-fg"],
  theme: {
    extend: {
      colors: {
        accent:  { DEFAULT: "#10B3B3" },
        fg:      "#0F172A",
        surface: { DEFAULT: "#121417" }
      }
    }
  },
  corePlugins: { preflight: false }
};
CFG

# CSS מינימלי (utilities בלבד)
echo '@tailwind utilities;' > "$ASSET_IN"

# תוכן זמני להבטחת הכללה
cat > "$ASSET_CONTENT" <<'HTML'
<!doctype html><div class="bg-accent bg-accent/60 bg-surface/60 text-fg"></div>
HTML

# Tailwind CLI — הבטחת זמינות (npx/התקנה מקומית)
set +e
npx --yes tailwindcss -v >/dev/null 2>&1
RC=$?
set -e
if [ $RC -ne 0 ]; then
  echo "[PKG] installing local tailwindcss"
  npm init -y >/dev/null 2>&1 || true
  npm i -D tailwindcss@^3 >/dev/null 2>&1
fi

echo "[BUILD] tailwindcss → $OUT"
ASSET_CONTENT="$ASSET_CONTENT" npx --yes tailwindcss -c "$ASSET_CFG" -i "$ASSET_IN" -o "$OUT" --minify --content "$ASSET_CONTENT"

# אימות מחלקות
for cls in '\.bg-accent' '\.text-fg' '\.bg-surface(\\\/|/)60'; do
  grep -Eq "$cls" "$OUT" || { echo "[ERR] missing class: $cls"; exit 21; }
done

# בדיקת AA contrast (fg על accent)
node - <<'JS'
function hexToRgb(h){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null;}
function relLum({r,g,b}){const f=x=>{x/=255; return x<=0.03928? x/12.92: ((x+0.055)/1.055)**2.4}; const R=f(r),G=f(g),B=f(b); return 0.2126*R+0.7152*G+0.0722*B;}
function contrast(h1,h2){const A=hexToRgb(h1),B=hexToRgb(h2); const L1=relLum(A),L2=relLum(B); const hi=Math.max(L1,L2), lo=Math.min(L1,L2); console.log('[AA] ratio',((hi+0.05)/(lo+0.05)).toFixed(2)); if((hi+0.05)/(lo+0.05)<4.5) process.exit(22);}
contrast("#0F172A","#10B3B3");
JS

# גודל קובץ
SIZE=$(stat -c%s "$OUT" 2>/dev/null || wc -c < "$OUT")
[ "$SIZE" -le 51200 ] || echo "[WARN] theme.css size=$SIZE (>50KB)"

# הוספה מאולצת (לעקוף .gitignore על dist/)
git add -f "$OUT"
if git diff --cached --quiet; then
  echo "[GIT] nothing to commit"
else
  git commit -m "ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css"
fi

git push -u origin ops/assets

echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL branch=ops/assets path=$OUT size=$SIZE"
