#!/usr/bin/env bash
# UX/DesignOps — Theme Pack Publisher v7.5 (GitHub API; safe tmp paths)
set -Eeuo pipefail
STEP_ID="ux-theme-pack-publish"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; TMP_DIR="$DUELLY_DIR/tmp"
mkdir -p "$LOG_DIR" "$TMP_DIR"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='${STEP_ID}' status=error time=$(date -Is) code=$c log='${LOG_FILE}' notes=\"theme pack publish failed (v7.5)\""; exit $c' ERR

# ==== Context & token ====
SRC_REPO="/root/backgammon-mini-app"; cd "$SRC_REPO" || { echo "[ERR] missing repo $SRC_REPO"; exit 10; }
ORIGIN_URL="$(git config --get remote.origin.url || true)"; [ -n "$ORIGIN_URL" ] || { echo "[ERR] missing git remote 'origin'"; exit 11; }
TOKEN="${GH_PAT:-${GITHUB_TOKEN:-}}"
if [ -z "$TOKEN" ] || [[ "$TOKEN" == *"<"*">"* ]]; then
  echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=MISSING_PAT log=$LOG_FILE notes=\"Set GH_PAT (no <>) with 'repo' scope\""
  exit 1
fi
API="https://api.github.com"; API_VER="2022-11-28"

# --- Normalize repo slug (.git/CR/LF/slashes) + optional overrides ---
clean_slug() { printf '%s' "$1" | tr -d '\r' | sed -E 's#(git@|https://)github.com[:/]+##; s#^/+##; s#/+$##; s#\.git$##'; }
if [ -n "${REPO_PATH_OVERRIDE:-}" ]; then REPO_PATH="$(clean_slug "$REPO_PATH_OVERRIDE")"; else REPO_PATH="$(clean_slug "$ORIGIN_URL")"; fi
OWNER="${OWNER_OVERRIDE:-${REPO_PATH%%/*}}"
REPO="${REPO_OVERRIDE:-${REPO_PATH##*/}}"
echo "[SANITY] origin=$ORIGIN_URL"
echo "[SANITY] slug=$REPO_PATH owner=$OWNER repo=$REPO"
[ -n "$OWNER" ] && [ -n "$REPO" ] || { echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=PARSE_REPO log=$LOG_FILE notes=\"Failed to parse owner/repo. Set OWNER_OVERRIDE/REPO_OVERRIDE.\"" ; exit 1; }

# ---- Helpers (safe tmp base paths) ----
safe_tag() { printf '%s' "$1" | sed -E 's#[^A-Za-z0-9._-]#_#g'; }
base_for() { local tag="$1"; local kind="$2"; echo "$TMP_DIR/${kind}-$(safe_tag "$tag")"; }
jget() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{let j=JSON.parse(s);let p='${1:-}'.split('.');for(let k of p){if(!k)continue;j=j[k]}console.log(j??'')}catch(e){}})"; }
get_api() { local URL="$1"; local BASE="$2"; curl -sS -D "${BASE}.h" -o "${BASE}.b" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $API_VER" "$URL"; }
put_api() { local URL="$1"; local BASE="$2"; local DATA="$3"; curl -sS -D "${BASE}.h" -o "${BASE}.b" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $API_VER" -X PUT "$URL" -d "$DATA"; }
post_api(){ local URL="$1"; local BASE="$2"; local DATA="$3"; curl -sS -D "${BASE}.h" -o "${BASE}.b" -w "%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: $API_VER" -X POST "$URL" -d "$DATA"; }

# ---- Repo perms ----
REPO_META_BASE="$(base_for "$OWNER/$REPO" repo)"
CODE=$(get_api "$API/repos/$OWNER/$REPO" "$REPO_META_BASE")
DEFAULT_BRANCH="$(cat "${REPO_META_BASE}.b" | jget 'default_branch')"
PUSH_PERM="$(cat "${REPO_META_BASE}.b" | jget 'permissions.push')"
ADMIN_PERM="$(cat "${REPO_META_BASE}.b" | jget 'permissions.admin')"
echo "[PERM] http=$CODE push=$PUSH_PERM admin=$ADMIN_PERM default=$DEFAULT_BRANCH"
[ -n "$DEFAULT_BRANCH" ] || DEFAULT_BRANCH="main"
if [ "$CODE" != "200" ]; then
  echo "[ERR] /repos failed (http=$CODE)"; tail -n 12 "${REPO_META_BASE}.b" || true
  echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=REPO_ACCESS log=$LOG_FILE notes=\"GitHub API /repos failed (http=$CODE).\"" ; exit 1
fi
if [ "$PUSH_PERM" != "true" ] && [ "$ADMIN_PERM" != "true" ]; then
  echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=NO_PUSH_PERMS log=$LOG_FILE notes=\"Token lacks contents:write on $OWNER/$REPO\"" ; exit 1
fi

# ---- Build theme.css (Tailwind → fallback) ----
TS=$(date +%Y%m%d-%H%M%S)
TARGET_BRANCH="ops/assets"; STAGING_BRANCH="ops/assets-staging-$TS"; FALLBACK_BRANCH="ux/theme-assets-$TS"
OUT_PATH="dist/assets/theme.css"
ASSET_CFG="$TMP_DIR/tw.asset.cjs"; ASSET_IN="$TMP_DIR/theme-in.css"; ASSET_HTML="$TMP_DIR/theme-content-$TS.html"
mkdir -p "$(dirname "$ASSET_IN")" "$(dirname "$OUT_PATH")"
cat > "$ASSET_CFG" <<'CFG'
module.exports = {
  content: [process.env.ASSET_CONTENT || ""],
  safelist: ["bg-accent","bg-accent/60","bg-surface/60","text-fg"],
  theme: { extend: { colors: { accent:{DEFAULT:"#10B3B3"}, fg:"#0F172A", surface:{DEFAULT:"#121417"} } } },
  corePlugins: { preflight: false }
};
CFG
echo '@tailwind utilities;' > "$ASSET_IN"
echo '<div class="bg-accent bg-accent/60 bg-surface/60 text-fg"></div>' > "$ASSET_HTML"

TAIL_OK="no"; set +e
npx --yes tailwindcss -v >/dev/null 2>&1 || { npm init -y >/dev/null 2>&1 || true; npm i -D tailwindcss@^3 >/dev/null 2>&1; }
ASSET_CONTENT="$ASSET_HTML" npx --yes tailwindcss -c "$ASSET_CFG" -i "$ASSET_IN" -o "$OUT_PATH" --minify --content "$ASSET_HTML"
RC=$?; set -e
if [ $RC -eq 0 ] && [ -s "$OUT_PATH" ] && grep -q '\.bg-accent' "$OUT_PATH" && grep -q '\.text-fg' "$OUT_PATH" && grep -Eq '\.bg-surface(\\\/|/)60' "$OUT_PATH"; then TAIL_OK="yes"; fi
if [ "$TAIL_OK" != "yes" ]; then
  cat > "$OUT_PATH" <<'CSS'
.bg-accent{--tw-bg-opacity:1;background-color:rgb(16 179 179 / var(--tw-bg-opacity))}
.bg-accent\/60{--tw-bg-opacity:.6;background-color:rgb(16 179 179 / var(--tw-bg-opacity))}
.bg-surface\/60{--tw-bg-opacity:.6;background-color:rgb(18 20 23 / var(--tw-bg-opacity))}
.text-fg{--tw-text-opacity:1;color:rgb(15 23 42 / var(--tw-text-opacity))}
CSS
fi
grep -q '\.bg-accent' "$OUT_PATH" || { echo "[ERR] missing .bg-accent"; exit 21; }
grep -q '\.text-fg'   "$OUT_PATH" || { echo "[ERR] missing .text-fg";   exit 21; }
grep -Eq '\.bg-surface(\\\/|/)60' "$OUT_PATH" || { echo "[ERR] missing .bg-surface/60"; exit 21; }
node - <<'JS'
function h(x){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(x);return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:null;}
function L({r,g,b}){const f=x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);}
const r=(a,b)=>{const hi=Math.max(a,b),lo=Math.min(a,b);return(hi+0.05)/(lo+0.05);};
if(r(L(h("#0F172A")),L(h("#10B3B3")))<4.5)process.exit(22);
JS

SIZE=$(stat -c%s "$OUT_PATH" 2>/dev/null || wc -c < "$OUT_PATH")
CONTENT_B64="$(base64 -w 0 "$OUT_PATH" 2>/dev/null || base64 "$OUT_PATH" | tr -d '\n')"
COMMIT_MSG="ux(theme): publish theme pack A1/T1 (AA) — dist/assets/theme.css"

publish_branch() {
  local BR="$1"; echo >echo >echo "[PUBLISH] branch=$BR"2 "[PUBLISH] branch=$BR"2 "[PUBLISH] branch=$BR"
  local REFS_BASE="$(base_for "$BR" 'refs')"
  local CODE; CODE=$(get_api "$API/repos/$OWNER/$REPO/git/refs/heads/$BR" "$REFS_BASE")
  if [ "$CODE" = "404" ]; then
    local DEFREF_BASE="$(base_for "$BR" 'defref')"
    local C2; C2=$(get_api "$API/repos/$OWNER/$REPO/git/refs/heads/$DEFAULT_BRANCH" "$DEFREF_BASE")
    local BASE_SHA="$(cat "${DEFREF_BASE}.b" | jget 'object.sha')"
    if [ -z "$BASE_SHA" ]; then
      local DEFBR_BASE="$(base_for "$BR" 'defbr')"
      C2=$(get_api "$API/repos/$OWNER/$REPO/branches/$DEFAULT_BRANCH" "$DEFBR_BASE")
      BASE_SHA="$(cat "${DEFBR_BASE}.b" | jget 'commit.sha')"
    fi
    [ -n "$BASE_SHA" ] || { echo "[ERR] resolve base SHA failed (http=$C2)"; tail -n 12 "${DEFREF_BASE}.b" 2>/dev/null || true; tail -n 12 "${DEFBR_BASE}.b" 2>/dev/null || true; return 3; }
    local CREATE_BASE="$(base_for "$BR" 'create')"
    local BODY="{\"ref\":\"refs/heads/$BR\",\"sha\":\"$BASE_SHA\"}"
    local C3; C3=$(post_api "$API/repos/$OWNER/$REPO/git/refs" "$CREATE_BASE" "$BODY")
    [ "$C3" = "201" ] || { echo "[ERR] create ref failed (http=$C3)"; tail -n 15 "${CREATE_BASE}.b" || true; return 4; }
  elif [ "$CODE" != "200" ]; then
    echo "[ERR] refs check failed (http=$CODE)"; tail -n 15 "${REFS_BASE}.b" || true; return 2
  fi

  local FILE_BASE="$(base_for "$BR" 'file')"
  local C4; C4=$(get_api "$API/repos/$OWNER/$REPO/contents/$OUT_PATH?ref=$BR" "$FILE_BASE")
  local FILE_SHA=""; [ "$C4" = "200" ] && FILE_SHA="$(cat "${FILE_BASE}.b" | jget 'sha')"

  local PUT_BASE="$(base_for "$BR" 'put')"
  local BODY="{\"message\":\"$COMMIT_MSG\",\"content\":\"$CONTENT_B64\",\"branch\":\"$BR\""
  [ -n "$FILE_SHA" ] && BODY="$BODY,\"sha\":\"$FILE_SHA\""
  BODY="$BODY}"
  local C5; C5=$(put_api "$API/repos/$OWNER/$REPO/contents/$OUT_PATH" "$PUT_BASE" "$BODY")
  if [ "$C5" = "201" ] || [ "$C5" = "200" ]; then echo "$BR"; return 0; fi
  echo "[ERR] put failed (http=$C5)"; tail -n 25 "${PUT_BASE}.b" || true; return 5
}

BR_DONE=""
for BR in "$TARGET_BRANCH" "$STAGING_BRANCH" "$FALLBACK_BRANCH"; do
  if RES="$(publish_branch "$BR" 2>&1 | tail -n 1)"; then BR_DONE="$RES"; break; fi
done
[ -n "$BR_DONE" ] || { echo "::DUELLY::step=$STEP_ID status=error time=$(date -Is) code=PUBLISH_FAILED log=$LOG_FILE notes=\"API publish failed to all branches (see log)\"" ; exit 1; }

RAW_URL="https://raw.githubusercontent.com/${OWNER}/${REPO}/${BR_DONE}/${OUT_PATH}"
echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) url=$RAW_URL branch=$BR_DONE path=$OUT_PATH size=$SIZE"
