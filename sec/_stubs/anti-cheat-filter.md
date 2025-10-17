# Anti-Cheat Filter
- Detect repeated commits from same user/IP within 1s window
- Log latency spikes >500ms for audit
- Optional: token bucket per session (burst=3)
- Integration: QA hooks via perf monitor
