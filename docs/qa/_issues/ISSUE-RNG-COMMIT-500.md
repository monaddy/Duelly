# [Blocker] RNG Commit /api/v2/rng/commit returns 500 on POST

**When:** 2025-10-18T10:32:02+00:00  
**Domain:** `https://play.duelly.online`  
**Health probe:** `health_code=000 t_total=%.3fsunreachable`

## Reproduction (curl)
```bash
curl -sS -X POST "https://play.duelly.online/api/v2/rng/commit"   -H 'Accept: application/json' -H 'Content-Type: application/json'   -d '{"clientCommitHex":"c965403ef488dc95628f0b0d0a972b109435624105ddb9ef0df482c59da27d14"}' -i
```

**Expected:** HTTP 200 with JSON containing at least:
```json
{"id":"<CID>", "serverCommitHex":"<64-hex>"}
```

**Actual:** HTTP 500 (server error).

## Evidence & References
- Stage 7 Checklist: [docs/qa/QA-Stage7-CHECKLIST.md](../QA-Stage7-CHECKLIST.md)
- Stage 7 Report: [docs/qa/QA-Report.md](../QA-Report.md)
- Sign‑off: [docs/qa/QA-Stage7-SIGNOFF.md](../QA-Stage7-SIGNOFF.md)
- Live status JSON: [docs/qa/stage7-status-latest.json](../artifacts/stage7-latest/../stage7-status-latest.json)
- Blocker note: [docs/qa/blockers/STAGE7-RNG-COMMIT-500-LATEST.md](../blockers/STAGE7-RNG-COMMIT-500-LATEST.md)
- Diagnostics:
  - `docs/qa/artifacts/stage7-latest/rng-commit-500-api_v2-tail.txt`
  - `docs/qa/artifacts/stage7-latest/rng-commit-500-api_v2-env.txt`
  - `docs/qa/artifacts/stage7-latest/rng-commit-500-pg-check.txt`

## Acceptance Criteria
- `POST /api/v2/rng/commit` → **200** with `id` + `serverCommitHex`.
- Commit → Reveal → Verify passes for same `id`.
- Bad payloads → **4xx** (not **5xx**).

> Created by ChatOps step `qa-747-open-issue-rng-commit-500-v1-resume2` at 2025-10-18T10:32:02+00:00.
