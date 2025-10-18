# DUELLY — Stage 8 Acceptance Snapshot (HMAC/JWT/Anti-Cheat/Telegram/Headers)

**Domain:** https://play.duelly.online  
Generated: 2025-10-18T09:14:15+00:00

## Results (PASS/FAIL)
- **Webhook**: unsigned→401/403 = **fail**; replay de-dup = **pass**
- **JWT**:
  - alg safe (no "none") = **pass** (alg=HS512)
  - valid token accepted = **pass**
  - expired token rejected = **pass**
  - overall JWT = **pass**
- **HMAC/Fairness**: verify = **fail** (seed in commit: no)
- **Telegram initData**:
  - token present = **fail**
  - TTL ≤ 1440s = **pass** (TTL=1440s)
  - local valid=true / tampered=false / expired=false → **fail**
- **HTTP Security Headers**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=fail, CORP=fail, OAC=fail → **fail**

### Overall: **fail**

## Remediation plan
- **Webhook**: enforce HMAC header (reject unsigned) + replay cache; re-run sec-810.
- **JWT**: keep alg safe; enforce exp/aud/iss; re-run sec-820.
- **Telegram**: set TELEGRAM_BOT_TOKEN in /root/duelly/.duelly/secure.env; keep TTL ≤ 1440s; re-run sec-840.
- **Headers**: apply `docs/sec/snippets/nginx-sec-headers.stage8.conf` and re-run sec-830 until COOP/CORP/OAC are ok.
