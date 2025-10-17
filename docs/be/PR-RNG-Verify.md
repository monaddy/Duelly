# BE PR Stub — GET /api/v2/rng/verify?id=<CID>
## Purpose
Public fairness verifier for Commit→Reveal (HMAC-SHA256). Enables FE/UX to show "Verify" UI.
## Contract
- GET `/api/v2/rng/verify?id=<CID>`
- 200: { id, matchId, serverCommitHex, revealed, serverSeedHex?, dice? }
- 404: CID not found
- 409: Commit exists but not revealed (optional)
## Exit
HOLD_FOR_APPROVAL
