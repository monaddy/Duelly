#!/usr/bin/env bash
# UX/DesignOps — Theme Pack Publisher v4 (A1/T1)
# Tailwind-CLI -> fallback CSS; git add -f; push to ops/assets or staging; PR optional; ChatOps.

set -Eeuo pipefail
STEP_ID="ux-theme-pack-publish"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='${STEP_ID}' status=error time=$(date -Is) code=$c log='${LOG_FILE}' notes=\"theme pack publish failed (v4)\""; exit $c' ERR

SRC_REPO="/root/backgammon-mini-app"
cd "$SRC_REPO" || { echo "[ERR] missing repo $SRC_REPO"; exit 10; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"
[ -n "$ORIGIN_URL" ] || { echo "[ERR] missing git remote 'origin'"; exit 11; }

# Normalize repo path (ל‑RAW URL)
REPO_PATH="$(printf '%s\n' "$ORIGIN_URL" | sed -E 's#(git@|https://)github.com[:/](.*)(\.git)?#\2#')"
OWNER="$(printf '%s' "$REPO_PATH" | cut -d'/' -f1)"
REPO="$(printf '%s' "$REPO_PATH" | cut -d'/' -f2)"

ts=$(date +%Y%m%d-%H%M%S)
WORK="$TMP_DIR/theme-pack-$ts"
echo "[CTX] origin=$ORIGIN_URL work=$WORK"
git clone "$ORIGIN_URL" "$WORK"
cd "$WORK"
git config user.email >/dev/null 2>&1 || git config user.email "ux-bot@duelly.local"
git config user.name  >/dev/null 2>&1 || git config user.name  "UX Bot"

git fetch origin -q || true
TARGET_BRANCH="ops/assets"
FALLBACK_BRANCH="ops/assets-staging-$ts"

# Checkout ליעד אם קיים, אחרת מ-main
if git ls-remote --exit-code --heads origin "$TARGET_BRANCH" >/dev/null 2>&1; then
  git checkout -B "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
else
  git checkout -B "$TARGET_BRANCH" origin/main 2>/dev/null || git checkout -B "$TARGET_BRANCH"
fi

# קבצי יצירה
ASSET_CFG="tailwind.config.asset.cjs"
ASSET_IN="src/theme.css"
ASSET_CONTENT="$TMP_DIR/theme-content-$ts.html"
OUT="dist/assets/theme.css"
mkdir -p "$(dirname "$ASSET_IN")" "$(dirname "$OUT")"

# Tailwind cfg מינימלי + safelist
cat > "$ASSET_CFG" <<'CFG'
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}","./index.html",process.env.ASSET_CONTENT || ""],
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
echo '@tailwind utilities;' > "$ASSET_IN"
cat > "$ASSET_CONTENT" <<'HTML'
<!doctype html><div class="bg-accent bg-accent/60 bg-surface/60 text-fg"></div>
HTML

# ניסיון Tailwind-CLI (עם התקנה מקומית אם צריך)
TAIL_OK="no"
set +e
npx --yes tailwindcss -v >/dev/null 2>&1
RC=$?
set -e
if [ $RC -ne 0 ]; then
  echo "[PKG] installing local tailwindcss"
  npm init -y >/dev/null 2>&1 || true
  npm i -D tailwindcss@^3 >/dev/null 2>&1
fi
set +e
ASSET_CONTENT="$ASSET_CONTENT" npx --yes tailwindcss -c "$ASSET_CFG" -i "$ASSET_IN" -o "$OUT" --minify --content "$ASSET_CONTENT"
RC=$?
set -e
if [ $RC -eq 0 ] && [ -s "$OUT" ] && grep -q '\.bg-accent' "$OUT" && grep -q '\.text-fg' "$OUT" && grep -Eq '\.bg-surface(\\\/|/)60' "$OUT"; then
  TAIL_OK="yes"
  echo "[OK] tailwind build generated $OUT"
fi

# פלייבק ידני אם צריך
if [ "$TAIL_OK" != "yes" ]; then
  echo "[FALLBACK] generating minimal theme.css manually"
  cat > "$OUT" <<'CSS'
.bg-accent{--tw-bg-opacity:1;background-color:rgb(16 179 179 / var(--tw-bg-opacity))}
.bg-accent\/60{--tw-bg-opacity:.6;background-color:rgb(16 179 179 / var(--tw-bg-opacity))}
.bg-surface\/60{--tw-bg-opacity:.6;background-color:rgb(18 20 23 / var(--tw-bg-opacity))}
.text-fg{--tw-text-opacity:1;color:rgb(15 23 42 / var(--tw-text-opacity))}
CSS
fi

# אימות בסיס
for cls in '\.bg-accent' '\.text-fg' '\.bg-surface(\\\/|/)60'; do
  grep -Eq "$cls" "$OUT" || { echo "[ERR] missing class: $cls"; exit 21; }
done

# AA contrast (fg על accent)
node - <<'JS'
function hex(h){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null;}
function lum({r,g,b}){const f=x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
const ratio=(L1,L2)=>{const hi=Math.max(L1,L2),lo=Math.min(L1,L2);return(hi+0.05)/(lo+0.05);};
const r=ratio(lum(hex("#0F172A")),lum(hex("#10B3B3"))); if(r<4.5){console.error("[ERR] contrast",r.toFixed(2));process.exit(22)} else {console.log("[AA] contrast",r.toFixed(2));}
JS

# גודל קובץ
SIZE=$(stat -c%s "$OUT" 2>/dev/null || wc -c < "$OUT")

# הוספה מאולצת וקומיט
git add -f "$OUT"
if git diff --cached --quiet; then
  echo "[GIT] nothing to commit"
else
  git commit -m "ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css"
fi

RAW_URL_TARGET="https://raw.githubusercontent.com/${OWNER}/${REPO}/${TARGET_BRANCH}/dist/assets/theme.css"

# ניסיון push ליעד
set +e
git push -u origin "$TARGET_BRANCH"
P_RC=$?
set -e

if [ $P_RC -eq 0 ]; then
  echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL_TARGET branch=$TARGET_BRANCH path=$OUT size=$SIZE"
  exit 0
fi

# אם נדחה (ענף מוגן) — נפילה לענף staging
echo "[WARN] push to $TARGET_BRANCH rejected (likely protected). Falling back to $FALLBACK_BRANCH"
git checkout -B "$FALLBACK_BRANCH"
# ודא שהקובץ קיים גם פה
mkdir -p "dist/assets"; cp -f "$OUT" "dist/assets/theme.css"
git add -f "dist/assets/theme.css"
git commit -m "ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css (staging)" || true
git push -u origin "$FALLBACK_BRANCH"

RAW_URL_FALLBACK="https://raw.githubusercontent.com/${OWNER}/${REPO}/${FALLBACK_BRANCH}/dist/assets/theme.css"

# נסיון לפתוח PR אם gh זמין
PR_URL=""
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  set +e
  gh pr view "$FALLBACK_BRANCH" >/dev/null 2>&1 || gh pr create -B "$TARGET_BRANCH" -H "$FALLBACK_BRANCH" \
    -t "Theme Pack (A1/T1) — dist/assets/theme.css" \
    -b "Publishing stable theme pack for FE. Please merge into ${TARGET_BRANCH}."
  PR_URL="$(gh pr view --json url -q .url "$FALLBACK_BRANCH" 2>/dev/null)"
  set -e
fi

echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL_FALLBACK branch=$FALLBACK_BRANCH path=dist/assets/theme.css size=$SIZE"
echo "[NOTE] Push ל-${TARGET_BRANCH} נדחה. פורסם ל-${FALLBACK_BRANCH}. ${PR_URL:+PR=${PR_URL}}"
echo "[HOWTO] לאשר סופית: merge את ה-PR ל-${TARGET_BRANCH} או הסר הגנה זמנית ודחוף."
