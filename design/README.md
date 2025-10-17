# Backgammon Mini App — Design Handoff v0.1

This folder contains the non-code UX deliverables for the MVP:
— Design tokens (colors/typography/spacing/radii/elevation/z/motion)
— Motion tokens & 60fps budget
— Telegram WebApp UI Kit notes
— Locales (EN/HE) for core microcopy
— Asset pipeline: atlas plan + Pixi bundle manifest
— Accessibility & RTL guidance
— Audio/Haptics mapping
— Core flows (PvP/Practice/Reconnect) for prototypes

> Scope: UI/UX handoff only. No application logic.

## Structure
design/
 ├─ tokens/ … JSON tokens for FE ingestion
 ├─ locales/ … en/he base copy
 ├─ assets/ … atlas plan, pixi manifest, fairness sample
 └─ spec/ … UX specs (motion, telegram kit, a11y, flows, audio)

## Usage
1) FE maps `tokens/*.json` → Tailwind config & Pixi runtime.
2) Load `assets/pixi.manifest.v01.json` via Pixi Assets bundle loader.
3) Use `locales/*.json` as the initial i18n seeds (keys are stable).

## Quality gates
- Contrast AA (body ≥4.5:1; large numerals ≥3:1)
- Touch targets ≥44×44dp
- Reduced motion support (no shakes, shorter durations)
- RTL: mirrored icons & slide directions
- Telegram Theme API mapped to tokens when available

## CL placeholders (pending PM/Compliance)
- CL-02 Age threshold (18/21) & target regions → copy uses {{age}}
- CL-03 Geo-Block list/mechanism → Paid flows remain gated
- CL-05 Settlement rounding & payout timing → copy is generic for now

Version: v0.1 • Owner: UX-Chat • Status: HOLD_FOR_APPROVAL
