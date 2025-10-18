# DUELLY — Security Stage 8 Hardening Report

This report aggregates results for Stage 8: Webhook, JWT, HMAC/Fairness, Telegram initData, and HTTP Security Headers.

<!-- BEGIN:SEC-800 -->
## sec-800 — Audit Secrets (v1)

- **secure.env**: exists=yes, perms=600, owner=root:root
- **Keys (presence/strength)**:
  - WEBHOOK_SECRET: miss (length hidden)
  - JWT_ALG: miss
  - JWT credentials: miss (mode=none; value hidden)
  - HMAC/Fairness key: miss (key=none; length hidden)
  - Telegram bot token: miss
  - Telegram initData key/public key: miss
  - Telegram initData max-age ≤ 24m (1440s): miss

- **Compose references secure.env**: miss

- **Leak suspects in repo**: 14 file(s) — *paths only, content not shown*. See: `/root/backgammon-mini-app/docs/sec/artifacts/sec-800-leak-suspects.txt`

Generated: 2025-10-18T08:13:30+00:00
<!-- END:SEC-800 -->

<!-- BEGIN:SEC-810 -->
## sec-810 — Webhook Enforcement (v1)

- **WEBHOOK_SECRET present**: yes
- **Seeded this run**: WEBHOOK_SECRET JWT_ALG JWT_SECRET FAIR_COMMIT_HMAC_KEY TELEGRAM_INITDATA_MAX_AGE_SEC
- **Route discovery**: 5 candidate path(s). See `/root/backgammon-mini-app/docs/sec/artifacts/sec-810-webhook-candidates.txt`.
- **Live tests** (HTTP codes per path): see `/root/backgammon-mini-app/docs/sec/artifacts/sec-810-webhook-tests.log`
  - Enforcement (unsigned → 401/403 expected): unknown
  - De-duplication (replay → 409/429/208 expected): present

Generated: 2025-10-18T08:27:32+00:00
<!-- END:SEC-810 -->

<!-- BEGIN:SEC-820 -->
## sec-820 — JWT Config & Tests (v1)

- **JWT_ALG**: ok (value safe)
- **JWT_SECRET present**: yes
- **EXP (JWT_EXP_SECONDS)**: 900s
- **AUD/ISS set**: aud=set, iss=set
- **Artifacts**:
  - Tokens: `/root/backgammon-mini-app/docs/sec/artifacts/sec-820-jwt-valid.jwt`, `/root/backgammon-mini-app/docs/sec/artifacts/sec-820-jwt-expired.jwt`, `/root/backgammon-mini-app/docs/sec/artifacts/sec-820-jwt-none.jwt` (not printed)
  - Local verify summary: `/root/backgammon-mini-app/docs/sec/artifacts/sec-820-jwt-local-verify.json`
  - Endpoint tests: `/root/backgammon-mini-app/docs/sec/artifacts/sec-820-jwt-endpoint-tests.log` (Auth enforcement: partial_or_unknown)
  - Compose override snippet: `/root/backgammon-mini-app/docs/sec/snippets/docker-compose.override.sec8.yml`

Generated: 2025-10-18T08:34:12+00:00
<!-- END:SEC-820 -->

<!-- BEGIN:SEC-830 -->
## sec-830 — HTTP Security Headers Audit (v1)

- **Domain**: https://play.duelly.online
- **Endpoints tested**: 4 (details in `/root/backgammon-mini-app/docs/sec/artifacts/sec-830-headers-checks.tsv`, raw headers in `/root/backgammon-mini-app/docs/sec/artifacts/sec-830-headers/`)
- **Root ("/")**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=miss, CORP=miss, OAC=miss
- **Across all tested endpoints (worst-case)**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=miss, CORP=miss, OAC=miss
- **Nginx snippet (proposed)**: `/root/backgammon-mini-app/docs/sec/snippets/nginx-sec-headers.stage8.conf` (to be added in PR under nginx service)

Generated: 2025-10-18T08:39:49+00:00
<!-- END:SEC-830 -->

<!-- BEGIN:SEC-840 -->
## sec-840 — Telegram initData Verification (v1)

- **Bot token present**: miss
- **TTL (max age)**: 1440s (≤1440 required): ok
- **Local verifier results**:
  - valid:   ok=true
  - tampered: ok=false (expected false)
  - expired: ok=false (expected false)
  See `/root/backgammon-mini-app/docs/sec/artifacts/sec-840-telegram-tests.log`, vectors: `/root/backgammon-mini-app/docs/sec/artifacts/sec-840-valid.initdata`, `/root/backgammon-mini-app/docs/sec/artifacts/sec-840-tampered.initdata`, `/root/backgammon-mini-app/docs/sec/artifacts/sec-840-expired.initdata`.
- **Live probes** (best-effort):
  - Accept valid: unknown
  - Reject tampered sig: likely
  - Reject expired TTL: likely
  Details: `/root/backgammon-mini-app/docs/sec/artifacts/sec-840-telegram-live.log`, candidates: `/root/backgammon-mini-app/docs/sec/artifacts/sec-840-endpoint-candidates.paths`.

Generated: 2025-10-18T08:52:44+00:00
<!-- END:SEC-840 -->

<!-- BEGIN:SEC-850 -->
## sec-850 — Stage 8 Finalization (v1)

**Domain:** https://play.duelly.online

### Acceptance snapshot
- **Webhook**: enforce unsigned → unknown; de-dup → present
- **JWT**: alg=::DUELLY::step=sec-850-report-and-pr-v1 (reject "none"); local(valid=status=error, expired=code=1 line=1 log=/root/duelly/.duelly/logs/sec-850-report-and-pr-v1-20251018-090250.log); endpoint auth=present
- **Telegram initData**: token=miss; ttl=1440s(ok); local(valid=true"info" tampered=false"info" expired=false"info")
- **Headers**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=miss, CORP=miss, OAC=miss
- **HMAC/Fairness**: commit↔reveal verify=true (artifacts under `/root/backgammon-mini-app/docs/sec/artifacts/sec-845-fairness`)

### Artifacts & Checklists
- Summary JSON: `/root/backgammon-mini-app/docs/sec/artifacts/sec-850-summary.json`
- Checklist: `/root/backgammon-mini-app/docs/sec/Stage8-Checklist.md`
- Nginx security snippet: `/root/backgammon-mini-app/docs/sec/snippets/nginx-sec-headers.stage8.conf`
- Compose env override: `/root/backgammon-mini-app/docs/sec/snippets/docker-compose.override.sec8.yml`

### Next actions (if any)
- If **COOP/CORP/OAC** are "miss": apply the Nginx snippet and reload nginx.
- If **Webhook enforcement** is "unknown": wire the signature middleware and replay cache, then re-run sec-810.
- If **Telegram token=miss**: set TELEGRAM_BOT_TOKEN in `/root/duelly/.duelly/secure.env` (do not commit) and re-run sec-840.

Generated: 2025-10-18T09:02:51+00:00
<!-- END:SEC-850 -->

<!-- BEGIN:SEC-866 -->
## sec-866 — Origin vs Edge Security Headers (diagnostics)

**Domain:** https://play.duelly.online  
**CDN detected:** none

### Origin (inside nginx container)
HSTS=ok, nosniff=ok, Referrer=ok, COOP=ok, CORP=ok, OAC=ok → all=ok  
Raw: `/root/backgammon-mini-app/docs/sec/artifacts/sec-866-origin-headers.txt`

### Edge (public)
HSTS=miss, nosniff=miss, Referrer=miss, COOP=miss, CORP=miss, OAC=miss → all=miss  
Raw: `/root/backgammon-mini-app/docs/sec/artifacts/sec-866-edge-headers.txt`


Generated: 2025-10-18T10:28:36+00:00
<!-- END:SEC-866 -->
