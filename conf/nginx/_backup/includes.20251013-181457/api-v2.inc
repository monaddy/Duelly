location /api/v2/ {
  limit_req zone=api_rps burst=60 nodelay;
  limit_conn api_conns 200;

  proxy_http_version 1.1;
  proxy_set_header Host              $host;
  proxy_set_header X-Real-IP         $remote_addr;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  proxy_connect_timeout 5s;
  proxy_send_timeout    60s;
  proxy_read_timeout    60s;

  proxy_pass http://api_upstream_v2;
}

location /socket.io-v2/ {
  limit_req zone=api_rps burst=120 nodelay;
  limit_conn api_conns 1000;

  proxy_http_version 1.1;
  proxy_set_header Upgrade           $http_upgrade;
  proxy_set_header Connection        $connection_upgrade;
  proxy_set_header Host              $host;
  proxy_set_header X-Real-IP         $remote_addr;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  proxy_read_timeout 3600s;
  proxy_send_timeout 120s;
  proxy_buffering off;

  proxy_pass http://api_upstream_v2/socket.io/;
}
