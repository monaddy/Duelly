# Motion Spec & 60fps Budget (v0.1)

## Tokens
- Durations: quick 120ms, fast 180ms, med 260ms, slow 420ms
- Easing: out (0.22,1,0.36,1), inout (0.65,0,0.35,1), overshoot (0.2,1.2,0.2,1)

## Board interactions
- Dice: shake 420ms (frames @~90fps internal), settle 180ms (small overshoot)
- Checker move: 70ms per point (cap 420ms), stagger 40ms on doubles
- Hit to bar: 240ms, subtle board micro-shake ±1.5px 80ms
- Bear-off arc: 260ms, small landing bounce

## UI
- Modal in 180ms / out 140ms
- Snackbar slide 180ms
- Legal highlight fade in/out 120ms

## Reduced Motion
- If OS or in-app reduce motion: remove shakes/jitter; shorten durations by ~30%.

## 60fps budget
- Target frame ≤16.7ms: CPU ≤6ms, GPU ≤10ms.
- Batch sprites; avoid big alpha stacks; precompute legal targets.
- Avoid layout thrash; timer text updated no more than once per second visually (SR live region every 5s, assertive <10s).

## Haptics (see audio-haptics.md)
- light: dice_land/confirm; medium: hit_to_bar.

## Testing
- Profile on mid-tier Android & iOS; ensure no GC spikes on move spam; disable filters on low-end mode.
