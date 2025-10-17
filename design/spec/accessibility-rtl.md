# Accessibility & RTL (v0.1)

## Contrast & Text
- Body text ≥4.5:1; large numerals (dice/timers) ≥3:1
- Support text scaling up to 120% without layout break

## Touch & Focus
- Targets ≥44×44dp; spacing ≥8dp
- Visible focus ring 2px (token color.focus) on all tabbables
- Logical tab order on overlays/modals; focus trap with Back/ESC support

## Screen Readers
- Dice container: role="button", aria-label="Roll dice"; after roll announce "Roll: 6 and 2"
- Timers: aria-live="polite" every 5s; <10s switch to assertive
- Cube modal: aria-modal="true" + focus trap

## Color-blind safety
- Checker styles use shape and outline contrast; legal highlights: pattern hatch + luminance shift

## Reduced Motion
- Respect OS and in-app toggle; no shakes/jitter; shorten durations by ~30%

## RTL
- Set `dir="rtl"` for HE; mirror arrows/chevrons; slide-in from right
- Left-handed mode: mirror bottom bar, move drawer opens from left, dice zone nudged left

## Haptics & Sound
- One-tap mute; respect system mute
- Haptics light/medium only; no error startle

## QA checklist
- Contrast verified on Telegram dark/light
- Focus order correct on Cube modal
- Reconnect banner SR-announced
