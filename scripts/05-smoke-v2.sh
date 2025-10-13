#!/usr/bin/env bash
set -euo pipefail
ROOT="/root/backgammon-mini-app"
source "$ROOT/api-v2.env"
BASE="${APP_BASE_URL}/api/v2"
echo "GET $BASE/health"
curl -sS "$BASE/health" | sed -e 's/^{/\\n&/'
echo "GET $BASE/version"
curl -sS "$BASE/version" | sed -e 's/^{/\\n&/'
echo "GET $BASE/health/db"
curl -sS "$BASE/health/db" | sed -e 's/^{/\\n&/'
