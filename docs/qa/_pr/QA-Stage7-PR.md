# Stage 7 — Perf, Fairness, Webhook, WS (HOLD_FOR_APPROVAL: rng/commit 500)

**Status:** HOLD_FOR_APPROVAL  
Blocker: [/api/v2/rng/commit → HTTP 500](docs/qa/blockers/STAGE7-RNG-COMMIT-500-LATEST.md)

## Acceptance Checklist (live)
- [x] Health `/api/v2/health` — 200 & `{"ok":true}`
- [x] Webhook auth (wrong secret → 401), dedup on repeat (Telegram)
- [x] Socket.IO polling handshake (/socket.io, EIO=4)
- [ ] RNG Commit `/api/v2/rng/commit` — **FAIL (500)** → unblock required

**Docs & Artifacts**
- Report: [docs/qa/QA-Report.md](docs/qa/QA-Report.md)
- Acceptance Checklist: [docs/qa/QA-Stage7-CHECKLIST.md](docs/qa/QA-Stage7-CHECKLIST.md)
- Sign‑off: [docs/qa/QA-Stage7-SIGNOFF.md](docs/qa/QA-Stage7-SIGNOFF.md)
- Live Status JSON: [docs/qa/stage7-status-latest.json](docs/qa/stage7-status-latest.json)
- Latency baseline (CSV/JSON): [docs/qa/artifacts/stage7-latest](docs/qa/artifacts/stage7-latest)
- Bundle: <n/a>

**Next steps to merge**
1) Fix server handler for `/api/v2/rng/commit` (return 200 + `{id, serverCommitHex}`).  
2) Re‑run Stage 7 steps (qa‑720/721/722) → status flips to **APPROVAL READY**.  
3) Remove HOLD_FOR_APPROVAL label and merge.

_This body was generated at 2025-10-18T10:15:16+00:00._

<!-- STAGE7_BLOCKERS_START -->
### Blocker: RNG Commit returns 500 on POST

- Endpoint: `https://play.duelly.online/api/v2/rng/commit`
- Status: **FAIL_500** (commit cannot proceed to Reveal/Verify)
- Local Issue Doc: [ISSUE-RNG-COMMIT-500.md](/docs/qa/_issues/ISSUE-RNG-COMMIT-500.md)
- Latest Stage7 artifacts: [stage7-latest](/docs/qa/artifacts/stage7-latest)
- Live status JSON: [stage7-status-latest.json](/docs/qa/stage7-status-latest.json)

**Reproduction**
```bash
curl -sS -X POST "https://play.duelly.online/api/v2/rng/commit"   -H 'Accept: application/json' -H 'Content-Type: application/json'   -d '{"clientCommitHex":"<sha256-of-32-bytes-hex>"}' -i
```

**Expected (per spec):**
- 200 with `{id, serverCommitHex}`

**Observed:**
- HTTP 500 from server (see artifacts/log excerpts in PR)

<!-- STAGE7_BLOCKERS_END -->
