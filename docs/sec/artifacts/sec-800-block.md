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
