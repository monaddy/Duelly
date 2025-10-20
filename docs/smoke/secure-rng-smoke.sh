#!/usr/bin/env bash
set -Eeuo pipefail
API="${API:-https://play.duelly.online/api/v2}"
HDR=(-H "content-type: application/json" -H "accept: application/json")
echo "# Health"; curl -sS "$API/health"; echo; echo

echo "# Create match"
MATCH="$(curl -sS -X POST "$API/matches" "${HDR[@]}" -d '{}')"; echo "$MATCH"
MID="$(echo "$MATCH" | sed -n 's/.*"id":"\([0-9a-fA-F-]\{36\}\)".*/\1/p')"

echo; echo "# Commit without HMAC signature (should be 401)"
BODY="{\"matchId\":\"$MID\"}"
code="$(curl -sS -o /tmp/commit_nohmac.json -w "%{http_code}" -X POST "$API/rng/commit" "${HDR[@]}" -d "$BODY" || true)"
echo "HTTP: $code"; cat /tmp/commit_nohmac.json; echo

echo; echo "# Commit WITH HMAC signature (should be 200)"
# Requires HMAC_SECRET exported in current shell (same as server)
if [ -z "${HMAC_SECRET:-}" ]; then
  echo "ERROR: export HMAC_SECRET=<same as server> and rerun"; exit 2
fi
SIG="$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$HMAC_SECRET" -hex | awk '{print $2}')"
code="$(curl -sS -o /tmp/commit_hmac.json -w "%{http_code}" -X POST "$API/rng/commit" "${HDR[@]}" -H "X-Signature: $SIG" -d "$BODY" || true)"
echo "HTTP: $code"; cat /tmp/commit_hmac.json; echo

CID="$(sed -n 's/.*"id":"\([0-9a-fA-F-]\{36\}\)".*/\1/p' /tmp/commit_hmac.json)"
if [ -n "$CID" ]; then
  echo; echo "# Verify BEFORE reveal"; curl -sS "$API/rng/verify?id=$CID"; echo
  echo "# Reveal"; curl -sS -X POST "$API/rng/reveal" "${HDR[@]}" -d "{\"id\":\"$CID\"}"; echo
  echo "# Verify AFTER reveal"; curl -sS "$API/rng/verify?id=$CID"; echo
fi
