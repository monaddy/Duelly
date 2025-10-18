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
