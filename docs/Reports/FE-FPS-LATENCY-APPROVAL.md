# DUELLY — FE PR Approval Packet (FPS Overlay & Latency)

**Status:** HOLD_FOR_APPROVAL
**Generated:** 2025-10-17T18:03:21+00:00

- **Repo:** monaddy/Duelly
- **Base:** main
- **Branch:** feat/fps-latency-observability-stub
- **PR Link:** https://github.com/monaddy/Duelly/pull/new/feat/fps-latency-observability-stub

## Artifacts
- docs/PRs/FE-PR-STUB-FPS-LATENCY.md
- docs/PRs/FE-PR-CHECKLIST-FPS-LATENCY.md
- docs/PRs/FE-PR-SUMMARY-FPS-LATENCY.md
- docs/observability/fps-overlay.md
- docs/observability/latency-instrumentation.md
- docs/observability/twa-integration.md
- .github/PULL_REQUEST_TEMPLATE/fps-latency.md

## Summary

# FE PR Summary — FPS Overlay & Latency Instrumentation

**Status:** HOLD_FOR_APPROVAL  
**Generated:** 2025-10-17T18:02:21+00:00

- **Repo:** monaddy/Duelly
- **Base:** main
- **Branch:** feat/fps-latency-observability-stub
- **PR Link:** https://github.com/monaddy/Duelly/pull/new/feat/fps-latency-observability-stub

Artifacts:
- `docs/PRs/FE-PR-STUB-FPS-LATENCY.md`
- `docs/observability/fps-overlay.md`
- `docs/observability/latency-instrumentation.md`
- `docs/observability/twa-integration.md`
- `.github/PULL_REQUEST_TEMPLATE/fps-latency.md`

## Acceptance Checklist

# FE PR Checklist — FPS Overlay & Latency Instrumentation

**Scope**
- FPS Overlay via `PIXI.Ticker` (dev-only, gated by `?dev=1`)
- Latency instrumentation: REST (fetch Δt) + Socket.io RTT (roll/move/ack)
- Aggregation: in-memory, log p50/p95 every 10s (dev only)
- TWA: auto-hide overlay during MainButton payments/dialogs
- Brand Pack A1/T1, AA contrast; no prod visual impact

## Acceptance
- [ ] Visiting with `?dev=1` shows FPS overlay
- [ ] REST wrapper measures end-to-end Δt (TWA→Nginx→API V2→back)
- [ ] Socket RTT measured for `moveAttempt`/ack and `diceRolled`
- [ ] p50/p95 logged every 10s (dev-only)
- [ ] Overlay hides when TWA payment/dialog is active
- [ ] No business-logic changes; server remains authoritative
- [ ] No prod logs/UI footprint when `dev` flag absent
- [ ] p95 ≤ 150ms in basic flows on staging (network: normal)

## Testing Notes
- Devices/Browsers:
  - [ ] Android mid-tier + Telegram TWA
  - [ ] iOS mid-tier + Telegram TWA
  - [ ] Desktop Chrome (reference)
- Network:
  - [ ] Normal
  - [ ] 3G/slow profile (for regression, not acceptance)

**HOLD_FOR_APPROVAL**

## PR Stub Scope

# Frontend-Chat — PR Stub: FPS Overlay + Latency Instrumentation

**Goal**  
Enable performance verification per SSOT on staging: **60 FPS** and **p95 ≤ 150ms**.

---

## Scope (no runtime code in this PR)

- **FPS Overlay (PixiJS)**
  - Use `PIXI.Ticker` for real-time FPS sampling.
  - Disabled by default; enabled via **`?dev=1`** query param.
  - Respect Brand Pack **A1/T1** and a11y (**dev-only**, no visual impact in prod).

- **Latency Instrumentation**
  - **REST**: wrapper around `fetch` measuring TWA→Nginx→API V2 round-trip (Δt).
  - **Socket.io**: round-trip timing for `roll` / `move` / `ack` (per socketEvents v2).
  - In-memory aggregation; print **p50/p95** every **10s** to console (**dev-only**).

- **TWA Integration**
  - Auto-hide overlay when Telegram MainButton is in payment/dialog state.

- **Acceptance (Exit)**
  - Visiting with `?dev=1` shows FPS overlay and tracks REST/WS p95.
  - Console prints p50/p95 every 10s; basic scenarios confirm **p95 ≤ 150ms**.
  - Delivery ends with **HOLD_FOR_APPROVAL**.

- **References**
  - Staging behind **Nginx+TLS**; WS via Nginx; API V2 active.

---

## Touchpoints (to be implemented next PR)

- `src/observability/FpsOverlay.tsx` — PIXI.Ticker-driven overlay; gated by `?dev=1`.
- `src/utils/devFlag.ts` — parse and memoize `dev=1`.
- `src/utils/fetch.instrumented.ts` — REST wrapper; records durations.
- `src/network/socket.metrics.ts` — WS RTT helpers (`emitWithRTT`, correlation ids).
- `src/utils/metrics.ts` — aggregator (p50/p95 per channel) + 10s logging loop (dev-only).
- `src/store/useUIStore.ts` or `useMetricsStore.ts` — in-memory buffers; no persistence.
- `src/components/TwaMainButton.tsx` — hook to hide overlay on payment/dialog.

> **Non-goals**: Persisting metrics, shipping to APM, or modifying business logic.

---

## Dev UX

- Overlay respects Brand Pack A1/T1 tokens; no persistent UI footprint when `dev=0`.
- Console logs are **dev-only**; must be silent in production.

---

**HOLD_FOR_APPROVAL**

