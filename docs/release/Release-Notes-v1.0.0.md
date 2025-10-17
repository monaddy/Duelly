# Release v1.0.0 — Backgammon Mini App

## Summary
- Full production-ready build.
- Stages 1–8 completed and verified.
- Includes FE (PixiJS overlay + latency), BE (RNG verify endpoint), UX (BrandPack + Fairness UI), QA (p95≤150ms), SEC (HMAC/JWT/Anti-Cheat).

## Tasks
1. Verify uptime ≥99.9% (`/healthz`, `/api/v2/health`)
2. Confirm backup snapshots (Postgres + Redis)
3. Generate tag `v1.0.0`
4. Archive logs + dashboards to `/root/duelly/.duelly/done/v1.0.0`

## Exit
Tag pushed, dashboard exported, backup validated
