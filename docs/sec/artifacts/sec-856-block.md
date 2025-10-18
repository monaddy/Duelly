<!-- BEGIN:SEC-856 -->
## sec-856 — Acceptance Snapshot (fix)

Overall: **fail** — see `/root/backgammon-mini-app/docs/sec/ACCEPTANCE-Stage8.md`.
- Webhook: unsigned→401/403=fail; dedup=pass
- JWT: alg=HS512 (pass), valid=true, expired=false → pass
- Telegram: token=miss; TTL=1440s(pass); vectors OK=fail
- Headers: HSTS=ok, nosniff=ok, Referrer=ok, COOP=fail, CORP=fail, OAC=fail → fail

Generated: 2025-10-18T09:14:15+00:00
<!-- END:SEC-856 -->
