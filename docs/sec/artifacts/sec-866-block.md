<!-- BEGIN:SEC-866 -->
## sec-866 — Origin vs Edge Security Headers (diagnostics)

**Domain:** https://play.duelly.online  
**CDN detected:** none

### Origin (inside nginx container)
HSTS=ok, nosniff=ok, Referrer=ok, COOP=ok, CORP=ok, OAC=ok → all=ok  
Raw: `/root/backgammon-mini-app/docs/sec/artifacts/sec-866-origin-headers.txt`

### Edge (public)
HSTS=miss, nosniff=miss, Referrer=miss, COOP=miss, CORP=miss, OAC=miss → all=miss  
Raw: `/root/backgammon-mini-app/docs/sec/artifacts/sec-866-edge-headers.txt`


Generated: 2025-10-18T10:28:36+00:00
<!-- END:SEC-866 -->
