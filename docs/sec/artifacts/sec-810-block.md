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
