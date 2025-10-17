# Asset Pipeline (v0.1)

## Targets
- Baseline device width 390pt @3x → 1170px. Provide 1x/2x/3x sets.
- 60fps budget: limit overdraw; prefer atlases over many files.

## Atlases
- Max atlas size 2048×2048.
- Split into: `board`, `checkers`, `dice_cube`, `ui`.
- Padding 2–4px to avoid bleeding.

## Formats
- WEBP lossless for UI/common.
- PNG-32 for dice/checkers when crisp edges are required.
- KTX2/Basis (ASTC/ETC) — candidate for v2 (needs pipeline + runtime support).

## Naming
- `board_dark_v1@2x.webp`, `checker_light_v1@3x.png`, `dice_faces_v1@2x.png`, `ui_common_v1@2x.webp`.
- Keep version suffix (`_v1`) to support A/B or visual refresh.

## Memory budget (estimates @2x, WEBP lossless unless noted)
- board ≈1.2MB, checkers ≈0.6MB (PNG-32), dice_cube ≈0.4MB (PNG-32), ui ≈0.8MB → total ≈3.0MB.

## Pixi Integration
- Load via `assets/pixi.manifest.v01.json` bundles.
- Use sprite pooling for dice/checkers; avoid re-creating textures during turns.
- Prefer transforms over filters; batch static triangles; minimize alpha layers.

## Accessibility
- Checker palettes have high-contrast outlines; legal highlights use pattern+higher luminance, not hue only.

## QA
- Visual crispness on 360×800 and 390×844.
- No seams on point triangles; no mipmap artifacts.

## Ownership
- UX provides art direction + atlas layout; FE integrates; PM/Brand to finalize palette (CL-11/12).
