# [Follow-up] Remove preview fallback `theme.css` after Tailwind utilities are generated

**When:** 2025-10-19T05:39:18+00:00  
**Preview:** <http://104.238.172.232:4173> | **Probe:** <http://104.238.172.232:4173/theme-probe.html>

## Context
The preview currently loads a fallback stylesheet (`assets/theme.css`) to provide the utilities:
- `.bg-accent`, `.bg-accent/60`
- `.bg-surface/60`
- `.text-fg`

This fallback is **preview-only** and must be removed once Tailwind generates these utilities.

## Acceptance Criteria
1. Tailwind build (CI) contains the utilities above (verify in compiled CSS):
   - `.bg-accent`, `.bg-accent\/60`, `.bg-surface\/60`, `.text-fg`
2. The fallback link to `assets/theme.css` is removed from preview.
3. Probe page still renders correct colors & contrast without fallback (HTTP 200).
4. No regressions in existing CSS.

## Suggested Steps
1. Update `tailwind.config.*` to emit the target utilities (colors/tokens).
2. Build preview and grep for classes in compiled CSS. Example:
   ```bash
   grep -E '\.bg-accent(\/60)?|\.bg-surface\/60|\.text-fg' dist/assets/*.css
   ```
3. Remove fallback import/link from preview (keep production unchanged).
4. Re-deploy preview, re-run probe, update QA results.

## References
- QA Results (latest): [docs/Reports/FE-THEME-QA-LATEST.md](docs/Reports/FE-THEME-QA-LATEST.md)
- Delivery (latest):   [docs/Reports/FE-THEME-DELIVERY-LATEST.md](docs/Reports/FE-THEME-DELIVERY-LATEST.md)
- Signoff (latest):    [docs/Reports/FE-THEME-SIGNOFF-LATEST.md](docs/Reports/FE-THEME-SIGNOFF-LATEST.md)
- Merge Gate:          [docs/Reports/FE-THEME-MERGE-GATE.md](docs/Reports/FE-THEME-MERGE-GATE.md)
