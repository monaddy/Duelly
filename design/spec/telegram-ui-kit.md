# Telegram WebApp UI Kit — Mapping & Patterns (v0.1)

## Theme
- Read `window.Telegram.WebApp.themeParams`; map to tokens:
  - `button_color` → color.accent, `button_text_color` → on-accent
  - `bg_color`/`secondary_bg_color` → surface/surface2
  - `text_color`/`hint_color` → text/textSecondary
- Listen to `themeChanged` → live update CSS vars.

## MainButton / BackButton
- Use `MainButton` as primary CTA on Lobby (Quick Match / Play vs AI).
- Show `BackButton` on inner screens & modals as needed.
- States: loading/success mapped to button variants (icon tick ok).

## Safe Areas / Viewport
- Respect `env(safe-area-inset-*)` for top/bottom bars.
- Handle `viewportChanged` for dynamic height on mobile keyboards.

## Haptics
- `WebApp.HapticFeedback.impactOccurred('light'|'medium')`
  - light: dice land, confirm
  - medium: hit to bar

## Network & Lifecycle
- Reconnect banner + toast. On reconnect, pause timers (UX copy provided in locales).

## RTL
- Set `document.dir='rtl'` on HE locale. Mirror icons & slide-in directions.

## Left-handed mode
- Mirror bottom action bar, move list drawer from left, nudge dice zone left by 24dp.

## Compliance placeholders
- CL-02 Age gate: copy uses {{age}}; modal blocks Paid flows until resolved.
- CL-03 Geo-block: Paid CTAs hidden/disabled with explanatory banner.
- CL-05 Settlement rounding/timing: generic copy; final formatting TBD.
