# Audio & Haptics Mapping (v0.1)

| Event         | SFX file            | Vol (rel) | Len (ms) | Haptic  |
|---------------|---------------------|-----------|----------|---------|
| dice_roll     | dice_roll.wav       | -6 dB     | 420      | light   |
| dice_land     | dice_land.wav       | -4 dB     | 180      | light   |
| checker_slide | checker_slide.wav   | -8 dB     | 120      | none    |
| hit_to_bar    | hit_pop.wav         | -5 dB     | 240      | medium  |
| bearoff       | bearoff_clack.wav   | -6 dB     | 260      | light   |
| illegal_move  | illegal_buzz.wav    | -10 dB    | 200      | none    |
| ui_tap        | ui_tap.wav          | -8 dB     | 120      | light   |

## Guidelines
- Respect system mute; throttle SFX (≤2 per second per type).
- Small pitch variance (±2%) on slides for texture.
- Haptics via Telegram WebApp HapticFeedback: `impactOccurred('light'|'medium')`.

## File specs
- PCM WAV 44.1kHz mono, normalized; FE may compress to AAC/OGG as needed.
