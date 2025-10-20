# DUELLY — Smoke Examples (rng)
```bash
API="https://play.duelly.online/api/v2"
HDR=(-H "content-type: application/json" -H "accept: application/json")
curl -s "$API/health"
MID="$(curl -s -X POST "$API/matches" "${HDR[@]}" -d '{}' | jq -r '.id')"
CID="$(curl -s -X POST "$API/rng/commit" "${HDR[@]}" -d "{"matchId":"$MID"}" | jq -r '.id')"
curl -s "$API/rng/verify?id=$CID" | jq .
curl -s -X POST "$API/rng/reveal" "${HDR[@]}" -d "{"id":"$CID"}" | jq .
curl -s "$API/rng/verify?id=$CID" | jq .
```
