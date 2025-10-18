# PR: Stage 8 — HMAC/JWT/Anti-Cheat/Telegram/Headers (HOLD_FOR_APPROVAL)

**Scope**
- Webhook HMAC signature + replay de-dup (tests & harness)
- JWT hardening (alg safe, exp, aud/iss) + endpoint tests
- Telegram initData verifier (+TTL≤24m) + vectors
- HTTP security headers (HSTS/nosniff/Referrer/COOP/CORP/OAC) — nginx snippet
- Fairness commit→reveal→verify (anti-cheat)

**Artifacts**
See `docs/sec/artifacts/` and `docs/sec/snippets/`. Do **not** commit secrets — values sourced from /root/duelly/.duelly/secure.env.

**Deployment Notes**
- Apply nginx snippet to nginx service block and reload.
- Ensure services include `env_file: /root/duelly/.duelly/secure.env`.
- Set TELEGRAM_BOT_TOKEN in /root/duelly/.duelly/secure.env (server-only).

**Status**: HOLD_FOR_APPROVAL
