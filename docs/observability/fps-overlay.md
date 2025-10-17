# FPS Overlay (PixiJS) — Design Notes (Stub)

- Engine: `PIXI.Ticker.shared` for frame time; rolling average window (e.g., N=20).
- Visibility: off by default; enabled when `dev=1` (query param → `devFlag()`).
- Rendering: Lightweight DOM overlay (position: fixed, bottom-end). No Tailwind tokens hard-coded; use Brand Pack A1/T1.
- Accessibility: Contrast ≥ AA, focusable toggle only in dev.
- Lifecycle: overlay unsubscribes on route change/unmount; minimal GC pressure.
- TWA Hook: hide overlay while MainButton payment/dialog is active.

_No code in this PR — next PR adds the component and wiring._
