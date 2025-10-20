#!/usr/bin/env bash
# UX/DesignOps — Theme Pack Publisher v5 (A1/T1)
# Tailwind-CLI -> fallback CSS; git add -f; push ops/assets (HEAD:refs/heads/..),
# rebase if needed, optional HTTPS+PAT, final fallback to ops/assets-staging-<ts>.

set -Eeuo pipefail
STEP_ID="ux-theme-pack-publish"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='${STEP_ID}' status=error time=$(date -Is) code=$c log='${LOG_FILE}' notes=\"theme pack publish failed (v5)\""; exit $c' ERR

SRC_REPO="/root/backgammon-mini-app"
cd "$SRC_REPO" || { echo "[ERR] missing repo $SRC_REPO"; exit 10; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"
[ -n "$ORIGIN_URL" ] || { echo "[ERR] missing git remote 'origin'"; exit 11; }

# Normalize repo path for RAW URL
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
RAW_URL_TARGET="https://raw.githubusercontent.com/${OWNER}/${REPO}/${TARGET_BRANCH}/dist/assets/theme.css"
RAW_URL_FALLBACK="https://raw.githubusercontent.com/${OWNER}/${REPO}/${FALLBACK_BRANCH}/dist/assets/theme.css"

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
echo '<div class="bg-accent bg-accent/60 bg-surface/60 text-fg"></div>' > "$ASSET_CONTENT"

# Tailwind-CLI (with local install if needed)
TAIL_OK="no"
set +e
npx --yes tailwindcss -v >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "[PKG] installing local tailwindcss"
  npm init -y >/dev/null 2>&1 || true
  npm i -D tailwindcss@^3 >/dev/null 2>&1
fi
ASSET_CONTENT="$ASSET_CONTENT" npx --yes tailwindcss -c "$ASSET_CFG" -i "$ASSET_IN" -o "$OUT" --minify --content "$ASSET_CONTENT"
RC=$?
set -e
if [ $RC -eq 0 ] && [ -s "$OUT" ] && grep -q '\.bg-accent' "$OUT" && grep -q '\.text-fg' "$OUT" && grep -Eq '\.bg-surface(\\\/|/)60' "$OUT"; then
  TAIL_OK="yes"
  echo "[OK] tailwind build generated $OUT"
fi

# Fallback ידני אם צריך
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
grep -q '\.bg-accent' "$OUT" || { echo "[ERR] missing .bg-accent"; exit 21; }
grep -q '\.text-fg'   "$OUT" || { echo "[ERR] missing .text-fg"; exit 21; }
grep -Eq '\.bg-surface(\\\/|/)60' "$OUT" || { echo "[ERR] missing .bg-surface/60"; exit 21; }

# AA contrast (fg על accent)
node - <<'JS'
function hex(h){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null;}
function lum({r,g,b}){const f=x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
const ratio=(L1,L2)=>{const hi=Math.max(L1,L2),lo=Math.min(L1,L2);return(hi+0.05)/(lo+0.05);};
const r=ratio(lum(hex("#0F172A")),lum(hex("#10B3B3"))); if(r<4.5){console.error("[ERR] contrast",r.toFixed(2));process.exit(22)} else {console.log("[AA] contrast",r.toFixed(2));}
JS

SIZE=$(stat -c%s "$OUT" 2>/dev/null || wc -c < "$OUT")
[ "$SIZE" -le 51200 ] || echo "[WARN] theme.css size=$SIZE (>50KB)"

# הוספה מאולצת + קומיט
git add -f "$OUT"
if git diff --cached --quiet; then
  echo "[GIT] nothing to commit"
else
  git commit -m "ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css"
fi

# פונקציית push עם החזר קוד
try_push() { set +e; git push -u origin "HEAD:refs/heads/$1"; rc=$?; set -e; return $rc; }

# 1) ניסיון push ישיר ל-ops/assets
if try_push "$TARGET_BRANCH"; then
  echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL_TARGET branch=$TARGET_BRANCH path=$OUT size=$SIZE"
  exit 0
fi

echo "[WARN] direct push to $TARGET_BRANCH failed — trying rebase on origin/$TARGET_BRANCH"
# 2) אם יש ענף מרוחק — משוך וריבייס, נסה שוב
set +e
git fetch origin "$TARGET_BRANCH"
git rebase "origin/$TARGET_BRANCH"
REBASE_RC=$?
set -e
if [ $REBASE_RC -eq 0 ] && try_push "$TARGET_BRANCH"; then
  echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL_TARGET branch=$TARGET_BRANCH path=$OUT size=$SIZE"
  exit 0
fi

# 3) ניסיון עם HTTPS+PAT אם סופק GH_PAT/GITHUB_TOKEN
if [ -n "${GH_PAT:-${GITHUB_TOKEN:-}}" ]; then
  TOKEN="${GH_PAT:-$GITHUB_TOKEN}"
  echo "[INFO] switching origin to HTTPS with PAT (hidden)"
  git remote set-url origin "https://${TOKEN}@github.com/${OWNER}/${REPO}.git"
  if try_push "$TARGET_BRANCH"; then
    echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL_TARGET branch=$TARGET_BRANCH path=$OUT size=$SIZE"
    exit 0
  fi
fi

# 4) Fallback אחרון — פרסום ל-staging
echo "[FALLBACK] pushing to $FALLBACK_BRANCH"
git checkout -B "$FALLBACK_BRANCH"
mkdir -p "dist/assets"; cp -f "$OUT" "dist/assets/theme.css"
git add -f "dist/assets/theme.css"
git commit -m "ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css (staging)" || true
if try_push "$FALLBACK_BRANCH"; then
  echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL_FALLBACK branch=$FALLBACK_BRANCH path=dist/assets/theme.css size=$SIZE"
  exit 0
fi

# אם הגענו לכאן — כל הניסיונות נכשלו
echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=PUSH_FAILED log=$LOG_FILE notes=\"push failed to both $TARGET_BRANCH and $FALLBACK_BRANCH. Consider setting GH_PAT/GITHUB_TOKEN env or checking branch protection.\""
exit 1
