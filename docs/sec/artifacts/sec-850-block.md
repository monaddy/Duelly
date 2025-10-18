<!-- BEGIN:SEC-850 -->
## sec-850 — Stage 8 Finalization (v1)

**Domain:** https://play.duelly.online

### Acceptance snapshot
- **Webhook**: enforce unsigned → unknown; de-dup → present
- **JWT**: alg=HS512 (reject "none"); local(valid=true, expired=true); endpoint auth=present
- **Telegram initData**: token=miss; ttl=1440s(ok); local(valid=true"info" tampered=false"info" expired=false"info")
- **Headers**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=miss, CORP=miss, OAC=miss
- **HMAC/Fairness**: verify=true"recomputed"

### Artifacts & Checklists
- Summary JSON: `/root/backgammon-mini-app/docs/sec/artifacts/sec-850-summary.json`
- Nginx security snippet: `/root/backgammon-mini-app/docs/sec/snippets/nginx-sec-headers.stage8.conf`
- Compose env override: `/root/backgammon-mini-app/docs/sec/snippets/docker-compose.override.sec8.yml`

### Next actions
- If **COOP/CORP/OAC** are "miss": apply nginx snippet and reload nginx.
- If **Webhook enforcement** is "unknown": wire signature middleware + replay cache and re-run sec-810.
- If **Telegram token=miss**: set TELEGRAM_BOT_TOKEN in /root/duelly/.duelly/secure.env and re-run sec-840.

Generated: 2025-10-18T09:05:45+00:00
<!-- END:SEC-850 -->
