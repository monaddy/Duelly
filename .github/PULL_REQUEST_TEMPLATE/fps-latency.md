---
name: "FE: FPS Overlay & Latency Instrumentation"
about: Dev-only observability overlay and latency metrics per SSOT
title: "Frontend-Chat — FPS Overlay + Latency Instrumentation [HOLD_FOR_APPROVAL]"
labels: enhancement, frontend, observability
---

## Summary
This PR implements **dev-only** observability:
- `PIXI.Ticker` FPS overlay (gated by `?dev=1`)
- REST Δt wrapper (TWA→Nginx→API V2→back)
- Socket.io RTT for `roll/move/ack`
- p50/p95 printed every 10s (dev only)
- Auto-hide overlay when TWA MainButton triggers payment/dialog
- Brand Pack A1/T1, AA contrast; no prod UI footprint

## Checklist
- [ ] See `docs/PRs/FE-PR-CHECKLIST-FPS-LATENCY.md` and tick all items
- [ ] No business logic moved into client
- [ ] Dev logs only; silent in production builds
- [ ] Includes docs updates; ends with **HOLD_FOR_APPROVAL**

## Screens / Logs
<!-- paste dev overlay screenshot and console p50/p95 samples -->

**HOLD_FOR_APPROVAL**
