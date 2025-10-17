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
