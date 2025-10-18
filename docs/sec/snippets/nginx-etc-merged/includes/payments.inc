# Payments webhook stricter limits
location = /api/payments/telegram/webhook {
  limit_req zone=api_rps burst=5 nodelay;
  limit_conn api_conns 50;

  proxy_http_version 1.1;
  proxy_set_header Host              $host;
  proxy_set_header X-Real-IP         $remote_addr;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  proxy_connect_timeout 5s;
  proxy_send_timeout    30s;
  proxy_read_timeout    30s;

  proxy_pass http://api_upstream_v1;
}
