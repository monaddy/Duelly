#!/usr/bin/env bash
set -Eeuo pipefail
API="${API:-https://play.duelly.online/api/v2}"
HDR=(-H "content-type: application/json" -H "accept: application/json")

echo "# Health"
curl -sS "$API/health"

echo -e "\n\n# Create match"
MATCH="$(curl -sS -X POST "$API/matches" "${HDR[@]}" -d '{}')"; echo "$MATCH"
MID="$(echo "$MATCH" | sed -n 's/.*"id":"\([0-9a-fA-F-]\{36\}\)".*/\1/p')"

echo -e "\n\n# RNG commit"
COMMIT="$(curl -sS -X POST "$API/rng/commit" "${HDR[@]}" -d "{\"matchId\":\"$MID\"}")"; echo "$COMMIT"
CID="$(echo "$COMMIT" | sed -n 's/.*"id":"\([0-9a-fA-F-]\{36\}\)".*/\1/p')"

echo -e "\n\n# Verify BEFORE (revealed=false)"
curl -sS "$API/rng/verify?id=$CID"; echo

echo -e "\n\n# Reveal (אופציונלי: אם השרת דורש seed, הגדרו SERVER_SEED_HEX=...)"
if [ -n "${SERVER_SEED_HEX:-}" ]; then
  curl -sS -X POST "$API/rng/reveal" "${HDR[@]}" -d "{\"id\":\"$CID\",\"serverSeedHex\":\"$SERVER_SEED_HEX\"}"; echo
else
  echo "Skipping /rng/reveal (no SERVER_SEED_HEX provided)."
fi

echo -e "\n\n# Verify AFTER (אם בוצעה חשיפה)"
curl -sS "$API/rng/verify?id=$CID"; echo
