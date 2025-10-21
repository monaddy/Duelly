# Stage 8 — RNG Commit Triage

- Generated: `2025-10-21T16:28:30+00:00`
- Domain: `play.duelly.online`
- Health: `200`
- Triage dir: `/root/duelly/.duelly/artifacts/qa-804-stage8-rng-commit-400-triage-v2-20251021-160438`

## Summary
- Attempts: **0 / 0** succeeded
- HTTP codes: n/a
- Paths tried: n/a
- Variants: n/a

## Top Server/Response Messages
_none captured_

## Reproduction (curl)
### 1) Generate a client commit (sha256 of 32 random bytes)
```bash
if command -v openssl >/dev/null 2>&1; then
  CLIENT_SECRET_HEX="$(dd if=/dev/urandom bs=1 count=32 2>/dev/null | xxd -p -c 64)"
  CLIENT_COMMIT_HEX="$(printf '%s' "$CLIENT_SECRET_HEX" | xxd -r -p | openssl dgst -sha256 -binary | xxd -p -c 64)"
else
  CLIENT_SECRET_HEX="$(head -c 32 /dev/urandom | xxd -p -c 64)"
  CLIENT_COMMIT_HEX="$(printf '%s' "$CLIENT_SECRET_HEX" | xxd -r -p | sha256sum | awk '{print $1}')"
fi
echo "clientCommitHex=$CLIENT_COMMIT_HEX"
```

### 2) POST commit to `/api/v2/rng/commit`
```bash
curl -sS -X POST "https://play.duelly.online/api/v2/rng/commit"   -H 'Accept: application/json' -H 'Content-Type: application/json'   -d "{\"clientCommitHex\":\"$CLIENT_COMMIT_HEX\"}" -i
```

> Notes: The server previously returned the codes summarized above. See raw records under: `/root/duelly/.duelly/artifacts/qa-804-stage8-rng-commit-400-triage-v2-20251021-160438/commit`.
