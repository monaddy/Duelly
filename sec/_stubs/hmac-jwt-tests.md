# HMAC/JWT Integrity Tests
- Verify RNG commit: serverCommitHex = HMAC_SHA256(seed, secret)
- Validate JWT exp/iat/nonce signature
- Negative tests: altered payload → 401/403
- Automation: run via Postman or k6 scripts
