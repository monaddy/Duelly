# Prototype Flows (v0.1)

## PvP — Happy path
1. Lobby → select stake card → Room (show commit hash, lock entry) → 3-2-1
2. Board: roll → moves → (optional) cube offer modal → confirm moves
3. Result: show payout 90/10 (points only via cube), fairness reveal JSON, CTAs Rematch / Back to Lobby
4. Replay preview: move list (text first)

## Practice
1. Lobby → Practice tab → select difficulty (wildbg) → Board → Result

## Reconnect / Grace
1. Board: disconnect banner + pause clock
2. Reconnect success within 5s grace → resume; else forfeit per rules
3. Toast history available in move drawer

## Error / Edge
- No legal moves → auto-pass to opponent; announce via toast + SR
- Illegal move drag → subtle shake + buzz SFX
- Cube offer when illegal → disabled button + tooltip copy

## Gates (PLACEHOLDER)
- CL-02 Age gate {{age}}+ blocks Paid flows until confirmed
- CL-03 Geo-block prevents Paid CTAs; Practice remains open
- CL-05 Settlement rounding/timing TBD; copy stays generic
