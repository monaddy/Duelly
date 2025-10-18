# DUELLY — Stage 7 Acceptance Checklist
Generated: `2025-10-18T09:58:26+00:00`  
Branch: `feat/qa-stage7-perf-fairness` • Domain: `play.duelly.online` • Status: **HOLD_FOR_APPROVAL**

## Acceptance Criteria
| Check | Expectation | Result | Details |
|---|---|---:|---|
| Health `/api/v2/health` | HTTP 200 & `{"ok":true}` | **PASS** | code=200 |
| Webhook auth (wrong secret) `/api/v2/payments/telegram/webhook` | **401 Unauthorized** | **PASS** | code=401 • expect_401=true • artifacts: see qa-710 logs |
| Webhook dedup | Duplicate delivery flagged (2nd send) | **PASS** (from qa-710 direct) | See: see qa-710 logs |
| RNG Commit `/api/v2/rng/commit` | 200 + id + serverCommitHex | **KNOWN-BLOCKER(500)** | code=500 • blocker: [STAGE7-RNG-COMMIT-500-LATEST.md](./blockers/STAGE7-RNG-COMMIT-500-LATEST.md) |
| Socket.IO polling handshake `/socket.io/?EIO=4&transport=polling` | 200 + `sid` | **PASS** | code=200 |

## Latency (baseline)
*(ms; best effort from latest latency-summary.json)*  
- Health: p50=n/a, p95=n/a  
- Socket.IO open: p50=n/a, p95=n/a  
- RNG Commit (for visibility while failing): p50=n/a, p95=n/a

## Links
- Report: [QA-Report.md](./QA-Report.md)
- Sign‑off: [QA-Stage7-SIGNOFF.md](./QA-Stage7-SIGNOFF.md)
- Blocker: [STAGE7-RNG-COMMIT-500-LATEST.md](./blockers/STAGE7-RNG-COMMIT-500-LATEST.md)
- Live Status JSON: [stage7-status-latest.json](./stage7-status-latest.json)
- Latency Artifacts (latest): [artifacts/stage7-latest](./artifacts/stage7-latest)

> **Note:** Status is **HOLD_FOR_APPROVAL** until RNG commit returns 2xx with valid payload (id + serverCommitHex) and fairness flow (Commit → Reveal → Verify) is green.
