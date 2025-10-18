#!/usr/bin/env bash
# DUELLY — Bootstrap UX/Repo (single script)
# יוצר עץ UX Handoff, מתקין תלויות (אם יש), init Git (אם צריך), ו‑push ל‑remote.
# מדפיס חתימת ChatOps עם time=<ISO> ומסיר במקרי שגיאה.

set -Eeuo pipefail

STEP_ID="${STEP_ID:-bootstrap-ux-v1}"
DUELLY_DIR="${DUELLY_DIR:-/root/duelly/.duelly}"
LOG_DIR="$DUELLY_DIR/logs"
TMP_DIR="$DUELLY_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"

# לוגים למסך + קובץ
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=$c log=$LOG_FILE notes=\"bootstrap failed\""; exit $c' ERR

# נעילה (אם flock קיים)
if command -v flock >/dev/null 2>&1; then
  exec {FD}> "$DUELLY_DIR/duelly.lock"
  flock -n "$FD" || { echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=LOCKED log=$LOG_FILE notes=\"another bootstrap running\""; exit 1; }
fi

# כלל בית: נתיב הרפו
REPO_DIR="${REPO_DIR:-/root/backgammon-mini-app}"
echo "[BOOT] cd ${REPO_DIR}"
cd "${REPO_DIR}" || { echo "missing repo dir ${REPO_DIR}"; exit 10; }

# פרמטרים
REMOTE_URL="${REMOTE_URL:-}"   # git@github.com:<owner>/<repo>.git  או https://...
BASE="${BASE:-main}"
BRANCH="${BRANCH:-feat/bootstrap-ux-$(date +%Y%m%d-%H%M%S)}"

echo "[BOOT] repo=${REPO_DIR} base=${BASE} branch=${BRANCH}"

# GIT — init/remote/branch
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[GIT] init repository"
  git init -b "${BASE}"
fi

ORIGIN_URL="$(git config --get remote.origin.url || true)"
if [ -z "${ORIGIN_URL}" ]; then
  if [ -z "${REMOTE_URL}" ]; then
    echo "[GIT] origin not set and REMOTE_URL is empty — cannot push"; exit 20;
  fi
  echo "[GIT] add origin ${REMOTE_URL}"
  git remote add origin "${REMOTE_URL}"
  ORIGIN_URL="${REMOTE_URL}"
fi

echo "[GIT] fetch origin (best-effort)"; git fetch origin -q || true
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "[GIT] checkout local ${BRANCH}"; git checkout "${BRANCH}"
else
  echo "[GIT] create branch ${BRANCH}"; git checkout -B "${BRANCH}" "origin/${BRANCH}" 2>/dev/null || git checkout -B "${BRANCH}"
fi

# UX Handoff skeleton — נוצר רק אם חסר (אידמפוטנטי)
mkdir -p design/tokens design/locales design/assets design/spec

[ -f design/README.md ] || cat > design/README.md <<'MD'
# Design Handoff — Bootstrap (v0.1)
Minimal placeholders. Replace with official UX deliverables when ready.
MD

[ -f design/tokens/design-tokens.v01.json ] || cat > design/tokens/design-tokens.v01.json <<'JSON'
{
  "color": {
    "accent": { "value": "#10B3B3" },
    "fg": { "value": "#0F172A" },
    "surface": { "value": "#121417" }
  },
  "typography": {
    "fontFamilySans": { "value": "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Hebrew'" },
    "size": { "md": { "value": "16px" }, "2xl": { "value": "24px" } }
  }
}
JSON

[ -f design/locales/en.json ] || cat > design/locales/en.json <<'JSON'
{ "general": { "reconnecting": "Reconnecting… your clock is paused." } }
JSON
[ -f design/locales/he.json ] || cat > design/locales/he.json <<'JSON'
{ "general": { "reconnecting": "מתבצעת התחברות מחדש… השעון שלך מושהה." } }
JSON

[ -f design/assets/pixi.manifest.v01.json ] || cat > design/assets/pixi.manifest.v01.json <<'JSON'
{ "bundles": [ { "name": "ui", "assets": [] } ] }
JSON

[ -f design/spec/README.md ] || cat > design/spec/README.md <<'MD'
# Specs (bootstrap)
Placeholder specs — replace with Motion/A11y/Telegram kit docs from UX handoff.
MD

# התקנת תלויות (אם קיים package.json)
PKG="none"
if [ -f package.json ]; then
  echo "[PKG] package.json detected"
  if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
    PKG="pnpm"; echo "[PKG] pnpm install"; pnpm install --frozen-lockfile || pnpm install
  elif [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then
    PKG="yarn"; echo "[PKG] yarn install"; yarn install --frozen-lockfile || yarn install
  else
    PKG="npm"; echo "[PKG] npm ci|install"; npm ci || npm install
  fi
else
  echo "[PKG] no package.json — skipping dependencies install"
fi

# commit + push (רק אם יש שינויים)
git add -A
if git diff --cached --quiet; then
  echo "[GIT] nothing to commit"
else
  MSG="chore(bootstrap): add UX design handoff tree & bootstrap script"
  echo "[GIT] commit: ${MSG}"
  git commit -m "${MSG}"
fi

echo "[GIT] push ${BRANCH} → origin"
git push -u origin "${BRANCH}"

echo "::DUELLY::step=${STEP_ID} status=ok time=$(date -Is) log=${LOG_FILE} notes=\"bootstrap done branch=${BRANCH} remote=${ORIGIN_URL} pkg=${PKG}\""
