#!/usr/bin/env bash
# UX/DesignOps — Theme Pack Publisher (A1/T1)
# יוצר theme.css יציב בעזרת Tailwind, בודק AA, דוחף לענף ops/assets, ומדפיס חתימת ChatOps עם RAW URL.

set -Eeuo pipefail
STEP_ID="ux-theme-pack-publish"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='$STEP_ID' status=error time=$(date -Is) code=$c log='$LOG_FILE' notes=\"theme pack publish failed\""; exit $c' ERR

SRC_REPO="/root/backgammon-mini-app"
cd "$SRC_REPO" || { echo "[ERR] missing repo $SRC_REPO"; exit 10; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"
[ -n "$ORIGIN_URL" ] || { echo "[ERR] missing git remote 'origin'"; exit 11; }

# מזהים owner/repo עבור RAW URL
REPO_PATH="$(printf '%s\n' "$ORIGIN_URL" | sed -E 's#(git@|https://)github.com[:/](.*)(\.git)?#\2#')"
OWNER="$(printf '%s' "$REPO_PATH" | cut -d'/' -f1)"
REPO="$(printf '%s' "$REPO_PATH" | cut -d'/' -f2)"
RAW_URL="https://raw.githubusercontent.com/${OWNER}/${REPO}/ops/assets/dist/assets/theme.css"

# מכינים clone נקי
ts=$(date +%Y%m%d-%H%M%S)
WORK="$TMP_DIR/theme-pack-$ts"
echo "[CTX] origin=$ORIGIN_URL work=$WORK"
git clone "$ORIGIN_URL" "$WORK"
cd "$WORK"
git config user.email >/dev/null 2>&1 || git config user.email "ux-bot@duelly.local"
git config user.name  >/dev/null 2>&1 || git config user.name  "UX Bot"

git fetch origin -q || true
# אם ops/assets קיים — נמשיך ממנו; אחרת מה-main
if git ls-remote --exit-code --heads origin ops/assets >/dev/null 2>&1; then
  git checkout -B ops/assets origin/ops/assets
else
  git checkout -B ops/assets origin/main 2>/dev/null || git checkout -B ops/assets
fi

# קבצי יצירה זמניים (לא נדרשים ל-commit)
ASSET_CFG="tailwind.config.asset.cjs"
ASSET_IN="src/theme.css"
ASSET_CONTENT="$TMP_DIR/theme-content-$ts.html"
OUT="dist/assets/theme.css"
mkdir -p "$(dirname "$ASSET_IN")" "$(dirname "$OUT")"

# קובץ קונפיג Tailwind מינימלי (tokens + safelist דרך content)
cat > "$ASSET_CFG" <<'CFG'
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./index.html",
    process.env.ASSET_CONTENT || ""
  ],
  theme: {
    extend: {
      colors: {
        // Brand A1/T1
        accent:  { DEFAULT: "#10B3B3" },
        fg:      "#0F172A",
        surface: { DEFAULT: "#121417" }
      }
    }
  },
  corePlugins: { preflight: false } // חבילת Utilities בלבד
};
CFG

# קובץ CSS מינימלי ל-tailwind (utilities בלבד)
cat > "$ASSET_IN" <<'CSS'
@tailwind utilities;
CSS

# "safelist" דרך תוכן זמני שמכיל את המחלקות הנדרשות
cat > "$ASSET_CONTENT" <<'HTML'
<!doctype html>
<div class="bg-accent bg-accent/60 bg-surface/60 text-fg"></div>
HTML

# יצירת theme.css במיניפיקציה (ללא תלות ב-TS/Vite)
echo "[BUILD] tailwindcss → $OUT"
ASSET_CONTENT="$ASSET_CONTENT" npx -y tailwindcss -c "$ASSET_CFG" -i "$ASSET_IN" -o "$OUT" --minify --content "$ASSET_CONTENT"

# בדיקות בסיס: קיום מחלקות
for cls in '\.bg-accent' '\.text-fg' '\.bg-surface(\\\/|/)60'; do
  if ! grep -Eq "$cls" "$OUT"; then
    echo "[ERR] missing class in output: $cls"
    exit 21
  fi
done

# בדיקת AA contrast (text-fg על bg-accent)
node - <<'JS'
function hexToRgb(h){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null;}
function relLum({r,g,b}){const f=x=>{x/=255; return x<=0.03928? x/12.92: ((x+0.055)/1.055)**2.4}; const R=f(r),G=f(g),B=f(b); return 0.2126*R+0.7152*G+0.0722*B;}
function contrast(hex1,hex2){const L1=relLum(hex1>hex2?hexToRgb(hex1):hexToRgb(hex2)); const L2=relLum(hex1>hex2?hexToRgb(hex2):hexToRgb(hex1)); return (L1+0.05)/(L2+0.05);}
const fg="#0F172A", bg="#10B3B3"; const ratio=contrast(fg,bg); 
if (ratio < 4.5) { console.error("[ERR] contrast ratio", ratio.toFixed(2), "< 4.5:1"); process.exit(22); }
console.log("[AA] contrast ratio", ratio.toFixed(2));
JS

# גודל קובץ
SIZE=$(stat -c%s "$OUT" 2>/dev/null || wc -c < "$OUT")
if [ "$SIZE" -gt 51200 ]; then
  echo "[WARN] theme.css size=$SIZE bytes (>50KB) — עדיין נמשיך, אך שקלו דיאטה."
fi

# commit + push (נכניס רק את הקובץ היעד תחת dist/assets/)
git add "$OUT"
if git diff --cached --quiet; then
  echo "[GIT] nothing to commit (theme unchanged)"
else
  git commit -m "ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css"
fi

git push -u origin ops/assets

echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL branch=ops/assets path=$OUT size=$SIZE"
