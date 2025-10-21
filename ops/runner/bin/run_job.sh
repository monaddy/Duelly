#!/usr/bin/env bash
set -Eeuo pipefail
JOB_ID="${1:-}"; shift || true
[ -n "$JOB_ID" ] || { echo "usage: $0 <job-id>"; exit 2; }
DUELLY_DIR="${DUELLY_DIR:-/root/duelly/.duelly}"
LOG_DIR="$DUELLY_DIR/logs"; mkdir -p "$LOG_DIR"
STEP_ID="ops-job-$JOB_ID"
LOG_FILE="$LOG_DIR/${STEP_ID}-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
exec {FD}> "$DUELLY_DIR/duelly.lock"
flock -n "$FD" || { echo "::DUELLY::ops-runner step=$STEP_ID status=error code=LOCKED"; exit 1; }

ALLOWLIST="${ALLOWLIST:-/root/backgammon-mini-app/ops/runner/allowlist.yml}"
CMD_LINE="$(awk -v id="$JOB_ID" '
  $1=="-"{next}
  $1=="jobs:"{injobs=1}
  injobs && $1=="-"{jid=""}
  injobs && $1=="id:"{sub(/id:[[:space:]]*/,""); jid=$0}
  injobs && $1=="cmd:"{sub(/cmd:[[:space:]]*/,""); if(jid==id){print $0; exit}}
' "$ALLOWLIST" 2>/dev/null || true)"
[ -n "$CMD_LINE" ] || { echo "::DUELLY::ops-runner step=$STEP_ID status=error code=NOT_ALLOWED notes=\"job not in allowlist\""; eval "exec ${FD}>&-"; exit 3; }

echo "::DUELLY::ops-runner step=$STEP_ID status=running cmd=\"$CMD_LINE\" log=$LOG_FILE"
set +e
bash -lc "$CMD_LINE"
RC=$?
set -e

eval "exec ${FD}>&-"
if [ "$RC" -eq 0 ]; then
  echo "::DUELLY::ops-runner step=$STEP_ID status=ok time=$(date -Is) log=$LOG_FILE"
else
  echo "::DUELLY::ops-runner step=$STEP_ID status=error code=$RC log=$LOG_FILE"
fi
