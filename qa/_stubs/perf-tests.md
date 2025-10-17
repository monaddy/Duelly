# Performance Tests (REST/WS)
- REST probe: GET /api/v2/health; POST /api/v2/matches
- WS probe: connect, roll/move/ack RTT
- Collect p50/p95; fail if p95>150ms
- Tools: curl/node/ws or k6 (optional)
