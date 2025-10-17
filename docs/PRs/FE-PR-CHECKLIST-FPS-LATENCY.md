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
