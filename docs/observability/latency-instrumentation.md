# Latency Instrumentation (REST + Socket.io) — Design Notes (Stub)

## REST
- Provide `instrumentedFetch(input, init)` wrapper.
- Measure Δt via `performance.now()` around `fetch`.
- Capture: method, url (path only), status, duration_ms.
- Dev-only aggregation (in-memory ring buffers).

## Socket.io
- `emitWithRTT(event, payload)` adds correlation id; server echoes id in ack or paired event.
- Track round-trip for:
  - `moveAttempt` → server ack/state
  - `diceRoll`/`roll` → `diceRolled`
  - generic ack path (as per socketEvents v2)

## Aggregation & Reporting
- Keep last N samples per channel (REST/WS).
- Every 10s (dev-only): compute p50/p95 and `console.info()` summary.
- Hard cap memory; silent in production builds.

_No code in this PR — next PR wires wrappers and interval._
