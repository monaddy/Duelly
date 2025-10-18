<!-- BEGIN:SEC-830 -->
## sec-830 — HTTP Security Headers Audit (v1)

- **Domain**: https://play.duelly.online
- **Endpoints tested**: 4 (details in `/root/backgammon-mini-app/docs/sec/artifacts/sec-830-headers-checks.tsv`, raw headers in `/root/backgammon-mini-app/docs/sec/artifacts/sec-830-headers/`)
- **Root ("/")**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=miss, CORP=miss, OAC=miss
- **Across all tested endpoints (worst-case)**: HSTS=ok, nosniff=ok, Referrer=ok, COOP=miss, CORP=miss, OAC=miss
- **Nginx snippet (proposed)**: `/root/backgammon-mini-app/docs/sec/snippets/nginx-sec-headers.stage8.conf` (to be added in PR under nginx service)

Generated: 2025-10-18T08:39:49+00:00
<!-- END:SEC-830 -->
