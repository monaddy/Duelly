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
