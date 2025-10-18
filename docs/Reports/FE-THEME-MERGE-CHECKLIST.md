# FE Theme — Merge Checklist

Generated: `2025-10-18T22:42:56+00:00`

- [ ] **Preview up (200):** <http://104.238.172.232:4173>
- [ ] **Probe up (200):** <http://104.238.172.232:4173/theme-probe.html>
- [ ] Review **QA Results**: [docs/Reports/FE-THEME-QA-LATEST.md](docs/Reports/FE-THEME-QA-LATEST.md)
- [ ] Review **Signoff**: [docs/Reports/FE-THEME-SIGNOFF-LATEST.md](docs/Reports/FE-THEME-SIGNOFF-LATEST.md)
- [ ] Review **Delivery bundle** (bundle+capture): [docs/Reports/FE-THEME-DELIVERY-LATEST.md](docs/Reports/FE-THEME-DELIVERY-LATEST.md)
- [ ] Review **Handoff note**: [docs/Reports/FE-THEME-HANDOFF-LATEST.md](docs/Reports/FE-THEME-HANDOFF-LATEST.md)
- [ ] Merge PR branch: `feat/qa-stage7-perf-fairness`
- [ ] **Prod remains unchanged** (fallback theme.css is preview-only)
- [ ] **Tailwind**: add utilities for `.bg-accent`, `.bg-accent/60`, `.bg-surface/60`, `.text-fg`
- [ ] Remove preview fallback import (`theme.css`) once Tailwind generates above utilities
- [ ] Rebuild preview, re-run probe, update QA results
