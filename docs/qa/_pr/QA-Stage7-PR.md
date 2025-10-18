# QA / Review PR Body
<!-- FE-THEME-QA:BEGIN -->
### FE Theme QA

- Preview: http://104.238.172.232:4173/
- Probe: http://104.238.172.232:4173/theme-probe.html  
- Results: [docs/Reports/FE-THEME-QA-RESULTS.md](docs/Reports/FE-THEME-QA-RESULTS.md) · [Latest pointer](../../Reports/FE-THEME-QA-LATEST.md)

(classes snapshot n/a)

> Preview-only fallback is safe; see results doc for details.
<!-- FE-THEME-QA:END -->
<!-- FE_THEME_QA_START -->
## FE Theme — Preview & QA

- **Preview:** <http://104.238.172.232:4173> (HTTP 200)
- **Probe:**   <http://104.238.172.232:4173/theme-probe.html> (HTTP 200)
- **QA Results:** see [FE‑THEME‑QA‑LATEST.md](docs/Reports/FE-THEME-QA-LATEST.md)

**Classes to verify:** `.bg-accent`, `.bg-accent/60`, `.bg-surface/60`, `.text-fg`.

> The fallback stylesheet is loaded in *preview only* and will be removed once Tailwind generates these utilities in production.
<!-- FE_THEME_QA_END -->
