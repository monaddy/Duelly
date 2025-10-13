# Security Baselines

This stack ships with sensible defaults. Review and harden per your risk profile.

## 1) Network & exposure

- **Private network**: `postgres`, `redis`, and `wildbg` are only on the `private` network and have **no published ports**.
- **Public edge**: Only `nginx` publishes ports (80; optionally 443). `api` is *not* directly exposed.
- **Healthchecks**: All workloads include healthchecks to avoid cascading failures.
- **No hardcoded secrets**: All sensitive values are read from environment (.env), not committed to VCS.

## 2) Data & volumes

- **Persistent volumes**:
  - `pgdata` → PostgreSQL data directory
  - `redisdata` → Redis AOF
  - `certs` → `/etc/letsencrypt` (certbot writes here)
  - `certbot-www` → webroot for ACME HTTP-01
  - `dhparam` → optional `dhparam.pem` for strong DH (TLS)
- Mounts to `nginx` are **read-only** for static content. Logs go to stdout/stderr.

## 3) TLS (Let’s Encrypt) guidance

This compose file is **HTTP-only by default** to stay runnable without local certs. To enable TLS:

1. Ensure DNS `A`/`AAAA` points to your host, and port **80 is reachable**.
2. Start the stack: `make up`.
3. Obtain certs (HTTP-01, webroot). Replace `yourdomain.example`:

   ```bash
   make certbot:init DOMAIN=yourdomain.example
   ```

   This writes certificates to `./certs/live/yourdomain.example/`.

4. (Optional) Generate DH params once:

   ```bash
   make dhparam
   ```

5. Edit `conf/nginx/sites-enabled/app.conf` and add a `server` block for `443`. Example:

   ```nginx
   server {
     listen 443 ssl http2;
     listen [::]:443 ssl http2;
     server_name yourdomain.example;

     ssl_certificate     /etc/letsencrypt/live/yourdomain.example/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.example/privkey.pem;
     ssl_session_cache   shared:SSL:10m;
     ssl_session_timeout 1d;
     ssl_protocols       TLSv1.2 TLSv1.3;
     ssl_ciphers         HIGH:!aNULL:!MD5;
     # Uncomment if you created dhparam.pem:
     # ssl_dhparam /etc/nginx/dhparam/dhparam.pem;
     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

     root /usr/share/nginx/html;
     index index.html;

     include /etc/nginx/conf.d/default.conf;  # reuse same locations (/api, /socket.io, SPA)
   }

   # Optionally redirect HTTP -> HTTPS
   server {
     listen 80;
     listen [::]:80;
     server_name yourdomain.example;
     location ^~ /.well-known/acme-challenge/ {
       alias /var/www/certbot/.well-known/acme-challenge/;
       default_type "text/plain";
       allow all;
     }
     return 301 https://$host$request_uri;
   }
   ```

6. Reload Nginx: `make nginx:reload`.

7. Renew automatically (cron/systemd timer) or via containerized cron. Manual renewal:

   ```bash
   make certbot:renew
   ```

> **Note**: Telegram Mini App requires **HTTPS** origins for production.

## 4) Edge rate-limiting (Nginx)

- **Global zones**:
  - `limit_req_zone $binary_remote_addr zone=api_rps:10m rate=30r/s;`
  - `limit_conn_zone $binary_remote_addr zone=api_conns:10m;`
- Applied in `app.conf`:
  - `/api/` → `burst=60` (short spikes ok)
  - `/socket.io/` → `burst=120`, `proxy_buffering off`, long `proxy_read_timeout` for WS
- HTTP 429 on excess. Adjust per traffic profile and SLO (p95 150 ms).

## 5) Additional hardening tips

- **Redis**: password required; no external port. Consider `rename-command` for dangerous ops.
- **Postgres**: rotate passwords; use `sslmode=require` when accessed cross-host.
- **Nginx**: keep `server_tokens off`; consider `Content-Security-Policy` matching your SPA.
- **Containers**: run as non-root where feasible; add `security_opt: no-new-privileges:true` and drop capabilities if you extend this stack.
- **Webhook idempotency**: implement at API (dedupe keys in Postgres + Redis).
- **Geo-blocking**: enforce at API level (IP geolocation) or behind a WAF/CDN as policy requires.
- **Age gate**: perform at APP/API; do not rely on edge alone.

## 6) Operational notes

- **PM2**: configured in `fork` mode (single instance) by default. For CPU-bound tasks, switch to `cluster` and scale; keep Socket.io sticky (at L4/L7) if load balancing across instances/hosts.
- **Zero-downtime reloads**: `make nginx:reload` (edge), PM2 supports graceful reload for API when you scale.
