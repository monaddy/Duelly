#!/usr/bin/env bash
set -euo pipefail
ROOT="/root/backgammon-mini-app"
SNIPPETS="$ROOT/conf/nginx/snippets"
APP_CONF="$ROOT/conf/nginx/sites-enabled/app.conf"

mkdir -p "$SNIPPETS"
cat > "$SNIPPETS/api-v2.conf" <<'NGINX'
# Upstream ל-service api_v2 (docker-compose שם אותו על רשת private)
upstream api_v2 {
  server api_v2:3000;
}

# REST prefix
location /api/v2/ {
  proxy_pass http://api_v2/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

# WebSocket (Socket.IO) בנתיב ייעודי כדי לא להתנגש עם ה-API הישן
location /socket.io-v2 {
  proxy_pass http://api_v2/socket.io-v2;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "Upgrade";
  proxy_set_header Host $host;
}
NGINX

# ודא שמבוצע include של הסניפט בקובץ ה-server
if ! grep -q "snippets/api-v2.conf" "$APP_CONF"; then
  echo "🔧 מוסיף include ל-$APP_CONF"
  # מוסיף לפני הסוגר של ה-server (}) הראשון
  awk '
    BEGIN{done=0}
    /server\s*\{/ {print; next}
    /\}/ && done==0 { print "    include /etc/nginx/snippets/api-v2.conf;"; done=1 }
    {print}
  ' "$APP_CONF" > "$APP_CONF.tmp" && mv "$APP_CONF.tmp" "$APP_CONF"
fi

echo "🔁 טוען מחדש Nginx..."
docker compose exec -T nginx nginx -t
docker compose exec -T nginx nginx -s reload
echo "✅ Nginx עודכן ל-/api/v2 ו-/socket.io-v2"
