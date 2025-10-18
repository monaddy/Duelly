# DUELLY • QA Stage 7 — Perf, Fairness, Webhook, WS (Report)
**Domain:** `play.duelly.online`  
**Generated:** 2025-10-18T09:18:33+00:00

## Acceptance Matrix
| Check | Result | Notes |
|---|---|---|
| /api/v2/health | ✅ PASS | latest GET returned ok=true (see `docs/qa/artifacts/stage7-20251018-091832/health-now.json`) |
| Webhook auth + dedup | ✅ PASS | endpoint `/api/v2/payments/telegram/webhook`, header `X-Telegram-Bot-Api-Secret-Token`; wrong=401, right=200, second=200 |
| WS polling handshake | ✅ PASS | validated previously: EIO=4 polling at `/socket.io/` |
| RNG /commit | ❌ FAIL | POST `/api/v2/rng/commit` returned 500 in triage runs (see artifacts under `/root/duelly/.duelly/artifacts/qa-723-rng-commit-root-cause-v1-20251018-085316-health.code`) |
| RNG /verify | ⛔ BLOCKED | depends on /commit success |

## Latency Baseline (ms)
Source: `docs/qa/artifacts/stage7-20251018-091832/latency-summary.json` (copied from latest qa-730)
| Endpoint | p50 | p95 | mean | success% |
|---|---:|---:|---:|---:|
| GET /api/v2/health (n=30) | 56 | 75 | 59 | 100 |
| GET /socket.io/?EIO=4&transport=polling | 55 | 72 | — | — |
| POST /api/v2/rng/commit | 55 | 58 | — | 0 |

## Fairness Flow — Commit → Reveal → Verify
**Status:** ❌ Not verified (commit failing with HTTP 500).  
Tried multiple payload shapes and content types; server returned 500/404/415 per variant. See diagnostics under:
- `/root/duelly/.duelly/artifacts/qa-723-rng-commit-root-cause-v1-20251018-085316-health.code`

## Webhook Security
- Wrong secret → **401**; Correct secret → **2xx**; Duplicate send → **2xx** (idempotent).  
Artifacts saved under `docs/qa/artifacts/stage7-20251018-091832/webhook-mini/`.

## Artifacts in PR
- `docs/qa/artifacts/stage7-20251018-091832/latency-summary.json`, `latency-summary.csv`
- `docs/qa/artifacts/stage7-20251018-091832/health-now.json` (+ headers/codes)
- `docs/qa/artifacts/stage7-20251018-091832/webhook-mini/*` (mini validation for report)

## Suggested Next Actions (Server)
1. **/api/v2/rng/commit:** add robust input validation and return 4xx on bad input instead of 500.  
2. Log internal error stack for commit failures and attach request-id to responses.  
3. Add CI e2e for Commit→Reveal→Verify to guard regressions.

_This PR is marked **HOLD_FOR_APPROVAL** until RNG commit is fixed and fairness flow passes._
