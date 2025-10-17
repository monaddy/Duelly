# Threat Model v1 (Stage 8)
## Areas
1. RNG manipulation — Mitigated by commit–reveal (HMAC-SHA256)
2. Session replay — Mitigated by JWT exp/nonce
3. Automation — Mitigated by rate-limit + anti-bot heuristics
4. Payment abuse — Mitigated by server-side validation
5. Network latency exploitation — Mitigated by timeout + fairness audit
