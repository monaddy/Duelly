# REST v2
location /api/v2/ {
  proxy_pass http://api_v2:3000;
  proxy_http_version 1.1;
  proxy_set_header Host              $host;
  proxy_set_header X-Real-IP         $remote_addr;
  proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_connect_timeout 5s;
  proxy_send_timeout    60s;
  proxy_read_timeout    60s;
}

# Socket.IO v2
location /socket.io-v2/ {
  proxy_pass http://api_v2:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade           $http_upgrade;
  proxy_set_header Connection        $connection_upgrade;
  proxy_set_header Host              $host;
  proxy_read_timeout 3600s;
  proxy_send_timeout 120s;
  proxy_buffering off;
}
