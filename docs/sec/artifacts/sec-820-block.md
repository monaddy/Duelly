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
