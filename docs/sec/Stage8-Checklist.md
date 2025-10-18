# DUELLY — Stage 8 Hardening Checklist

## Webhook
- [ ] Reject unsigned (expect 401/403)
- [x] De-dup replay (expect 409/429/208)
- [ ] Apply/verify backend signature middleware (see snippets if provided)

## JWT
- [x] alg safe (::DUELLY::step=sec-850-report-and-pr-v1), reject "none"
- [ ] valid token accepted
- [ ] expired token rejected
- [x] audience configured
- [x] issuer configured

## Telegram initData
- [ ] TELEGRAM_BOT_TOKEN present (server-side)
- [x] TTL ≤ 1440s (24m)
- [ ] local valid accepted
- [ ] local tampered rejected
- [ ] local expired rejected

## HTTP Security Headers (Nginx)
- [x] Strict-Transport-Security
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy
- [ ] Cross-Origin-Opener-Policy
- [ ] Cross-Origin-Resource-Policy
- [ ] Origin-Agent-Cluster
- [ ] If missing: apply `docs/sec/snippets/nginx-sec-headers.stage8.conf` in nginx server{}

## Compose / env
- [ ] services load secure.env
- [x] WEBHOOK_SECRET present
- [x] JWT_SECRET present
- [x] FAIR_COMMIT_HMAC_KEY present
- [x] TELEGRAM_INITDATA_MAX_AGE_SEC ≤ 1440

Generated: 2025-10-18T09:02:51+00:00
