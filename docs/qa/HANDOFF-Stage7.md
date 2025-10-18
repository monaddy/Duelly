# DUELLY — Stage 7 Handoff (HOLD_FOR_APPROVAL)

**Branch:** `feat/qa-stage7-perf-fairness` @ `2e558f9`  
**Domain:** https://play.duelly.online

## Status
- Health: `?`
- Socket.IO polling: `?`
- RNG Commit: `?` **(BLOCKER)**

## Key artifacts
- Status JSON: `docs/qa/stage7-status-latest.json`
- Latency summary: `/root/duelly/.duelly/artifacts/qa-730-latency-baseline-v1-20251018-091117/latency-summary.json`
- Stage7 bundle SHA256: `n/a`
- PR offline bundle SHA256: `n/a`
- Artifacts dir: `/root/backgammon-mini-app/docs/qa/artifacts/stage7-20251018-091832`

## Reproduction — RNG Commit 500
```bash
curl -sS -X POST "https://play.duelly.online/api/v2/rng/commit" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"clientCommitHex":"DEADBEEF"}' -i
```

## Next steps
1. Fix `/api/v2/rng/commit` to return `{ id, serverCommitHex }` and complete Commit → Reveal → Verify.
2. Re‑run `qa-720` → `qa-730` → `qa-740` and flip Stage 7 to **READY_FOR_REVIEW**.
3. Merge `feat/qa-stage7-perf-fairness` after blocker resolution.

- rng_commit=FAIL_500

**Blocker:** See docs/qa/blockers/STAGE7-RNG-COMMIT-500-LATEST.md
