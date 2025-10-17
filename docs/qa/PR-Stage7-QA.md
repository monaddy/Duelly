# QA Stage 7 — PR Stub (Performance p95≤150ms + Fairness E2E)

## Scope
- Performance: p95≤150ms for REST/WS critical paths (roll/move/ack, auth, match create)
- FPS: verify 60 FPS via FE overlay (`?dev=1`)
- Fairness: E2E Commit→Reveal validated via `/api/v2/rng/verify?id=<CID>`
- Exit: HOLD_FOR_APPROVAL

## Deliverables
- Testplan (this PR): scenarios, metrics, acceptance thresholds
- Scripts: REST & Socket latency probes; RNG verify E2E
- CI hook (optional) for smoke run on staging
