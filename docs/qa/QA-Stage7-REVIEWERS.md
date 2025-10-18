# DUELLY — Stage 7 Reviewers Guide (HOLD_FOR_APPROVAL)

**Domain:** `https://play.duelly.online`  
**Branch:** `feat/qa-stage7-perf-fairness`  
**Artifacts:**  
- Stage7 bundle: `/root/duelly/.duelly/artifacts/duelly-stage7-20251018-092522.tar.gz` (sha256: `3531253385a23f549c0b01a3ea802d408c10ac01a17c8ce5df144b49c52f7ae6`)  
- Offline PR bundle: `/root/duelly/.duelly/artifacts/duelly-pr-offline-feat-qa-stage7-perf-fairness-20251018-104511.tar.gz` (sha256: `91d6e2a7f1649787ed4d5da866c2d7e94c9ef35dfa94ef0e8cb10eba82d9cc6d`)  
- Live status JSON: `docs/qa/stage7-status-latest.json`  
- Stage7 artifacts dir: `/root/backgammon-mini-app/docs/qa/artifacts/stage7-20251018-091832`

## Quick Verifications
### 1) Health
```bash
curl -i "https://play.duelly.online/api/v2/health"
```
Expect: `200 {"ok":true}` (observed: 200)

### 2) Webhook (Telegram) — auth & dedup
> Uses header `X-Telegram-Bot-Api-Secret-Token: <redacted>` (configured server-side).
```bash
curl -sS -i -X POST "https://play.duelly.online/api/v2/payments/telegram/webhook"   -H 'Content-Type: application/json'   -H 'X-Telegram-Bot-Api-Secret-Token: definitely-wrong-secret'   --data-binary '{"update_id":123,"message":{"message_id":1,"date":'1760784879',"chat":{"id":1,"type":"private"},"text":"qa ping"}}'
# Expect: 401 on wrong secret; 2xx on right secret; duplicate id -> dedup indicator
```

### 3) RNG Commit → currently **BLOCKER (500)** on POST
```bash
curl -sS -i -X POST "https://play.duelly.online/api/v2/rng/commit"   -H 'Accept: application/json' -H 'Content-Type: application/json'   --data-binary '{"clientCommitHex":"<sha256-bytes-hex>"}'
# Observed: 500 (expected: 200 with {id, serverCommitHex})
```
See: `docs/qa/blockers/STAGE7-RNG-COMMIT-500-LATEST.md`

### 4) Socket.IO Polling Handshake
```bash
curl -i "https://play.duelly.online/socket.io/?EIO=4&transport=polling&t=1760784879000"
```
Expect: `200` with SID JSON (observed: 200)

---

**Status:** HOLD_FOR_APPROVAL (pending fix for rng/commit 500)  
