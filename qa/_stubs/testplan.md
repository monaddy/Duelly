# QA Test Plan — Stage 7
## Performance Targets
- REST/WS p95 ≤ 150 ms (staging)
- 60 FPS in-game (FE overlay)
## Scenarios
1) Auth (initData→JWT)
2) Match create (REST)
3) Roll/Move/Ack (WS)
4) RNG Commit→Reveal (+ verify endpoint)
5) Reconnect/Resync (WS handshake)
## Evidence
- Latency logs (p50/p95)
- FPS overlay screenshots
- RNG verify responses
## Exit
- All p95 thresholds met; RNG verify OK; defects triaged
