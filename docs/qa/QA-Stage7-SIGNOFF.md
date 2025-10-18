# DUELLY • QA Stage 7 — Sign‑off (HOLD_FOR_APPROVAL)

**Domain:** `play.duelly.online`  
**Generated:** 2025-10-18T09:43:52+00:00

## Summary
- **QA Report:** `docs/qa/QA-Report.md`
- **PR Branch:** `feat/qa-stage7-perf-fairness` (marked **HOLD_FOR_APPROVAL**)
- **Latency Baseline JSON:** `/root/duelly/.duelly/artifacts/qa-730-latency-baseline-v1-20251018-091117/latency-summary.json`
- **Dashboard Summary:** `/root/duelly/.duelly/done/stage7-summary-20251018-092253.json`
- **Bundle:** dir=`/root/duelly/.duelly/artifacts/stage7-bundle-20251018-092522`, tar=`duelly-stage7-20251018-092522.tar.gz` sha256=`3531253385a23f549c0b01a3ea802d408c10ac01a17c8ce5df144b49c52f7ae6`

## Acceptance Checklist
- ✅ /api/v2/health → ok:true
- ✅ Webhook auth (wrong=401 / right=2xx) + dedup via `/api/v2/payments/telegram/webhook` (header: `X-Telegram-Bot-Api-Secret-Token`)
- ✅ WS polling handshake (`/socket.io`, EIO=4)
- ❌ RNG fairness (Commit → Reveal → Verify): **BLOCKED** — `/api/v2/rng/commit` returns HTTP 500

## Next Steps (required to lift HOLD)
1. Fix server‑side error on `POST /api/v2/rng/commit` (return 4xx on bad input; avoid 5xx).
2. Re‑run Stage 7 steps 720→740; update the report; drop HOLD once Verify passes.

---
