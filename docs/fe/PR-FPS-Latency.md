# FE PR Stub — FPS Overlay & Latency Instrumentation

## Scope
- PixiJS FPS overlay (dev-only; toggled by `?dev=1`)
- REST & Socket latency instrumentation (p50/p95 logging)
- TWA safe integration (no overlay during payment dialogs)

## Deliverables
- `src/dev/fpsOverlay.ts` (PixiJS Ticker)
- `src/dev/latency.ts` (fetch/socket wrappers)
- Feature toggle: `?dev=1` → enable overlays & console stats
- Exit: HOLD_FOR_APPROVAL
