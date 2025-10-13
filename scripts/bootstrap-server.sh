#!/usr/bin/env bash
set -euo pipefail

# ----- קונפיג כללי -----
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
APP_DIR="/opt/backgammon-mini-app"
PROJECT_NAME="backgammon-mini-app"   # כפי שמוגדר ב-docker-compose.yml
CERTS_VOLUME="${PROJECT_NAME}_certs"
WEBROOT_VOLUME="${PROJECT_NAME}_certbot-www"

# אופציונלי: אסימוני טלגרם מהסביבה
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_PAYMENT_PROVIDER_TOKEN="${TELEGRAM_PAYMENT_PROVIDER_TOKEN:-}"

log() { echo -e "[\e[32mINFO\e[0m] $*"; }
warn() { echo -e "[\e[33mWARN\e[0m] $*"; }
err() { echo -e "[\e[31mERR \e[0m] $*" >&2; }

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    err "יש להריץ כ-root (או sudo -E)."
    exit 1
  fi
}

rand_hex() { openssl rand -hex 32; }

update_env_kv() {
  local key="$1" value="$2"
  cd "$APP_DIR"
  touch .env
  if grep -qE "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

install_docker() {
  source /etc/os-release || true
  if [[ "${ID:-}" != "ubuntu" && "${ID:-}" != "debian" ]]; then
    err "סקריפט זה תומך ב-Ubuntu/Debian בלבד."
    exit 1
  fi
  log "התקנת חבילות בסיס + Docker Engine/Compose…"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg lsb-release git make ufw

  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    curl -fsSL https://download.docker.com/linux/${ID}/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
  fi

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  systemctl enable --now docker
  log "Docker מותקן ופועל."
}

setup_ufw() {
  if command -v ufw >/dev/null 2>&1; then
    log "הגדרת חומת אש (UFW)…"
    ufw allow OpenSSH || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    yes | ufw enable || true
    ufw status || true
  fi
}

tune_sysctl() {
  log "כיוונון sysctl בסיסי ל-WS…"
  cat >/etc/sysctl.d/99-backgammon.conf <<'SYSCTL'
net.core.somaxconn=4096
net.core.netdev_max_backlog=16384
net.ipv4.tcp_fin_timeout=15
net.ipv4.tcp_tw_reuse=1
net.ipv4.ip_local_port_range=1024 65000
fs.file-max=1000000
SYSCTL
  sysctl --system >/dev/null
}

clone_repo() {
  if [[ -z "$REPO_URL" ]]; then
    err "יש לספק REPO_URL לריפו Git."
    exit 1
  fi
  log "שולף את הריפו אל ${APP_DIR}…"
  mkdir -p "$APP_DIR"
  if [[ ! -d "$APP_DIR/.git" ]]; then
    git clone "$REPO_URL" "$APP_DIR"
  fi
  cd "$APP_DIR"
  git fetch --all --prune
  git checkout "$BRANCH"
  git pull --ff-only || true
}

prepare_env_file() {
  cd "$APP_DIR"
  if [[ ! -f ".env" ]]; then
    log "יוצר .env מתוך .env.example…"
    cp .env.example .env
  fi

  # סיסמאות/סודות אוטומטיים (נוצרים פעם אחת בלבד אם הערך עדיין placeholder)
  grep -q "^POSTGRES_PASSWORD=please_change_me" .env && update_env_kv POSTGRES_PASSWORD "$(rand_hex)"
  grep -q "^REDIS_PASSWORD=please_change_me" .env && update_env_kv REDIS_PASSWORD "$(rand_hex)"
  grep -q "^JWT_SECRET=please_change_me" .env && update_env_kv JWT_SECRET "$(rand_hex)"
  grep -q "^HMAC_SECRET=please_change_me" .env && update_env_kv HMAC_SECRET "$(rand_hex)"

  # פורט/הוסט
  update_env_kv NODE_ENV "production"
  update_env_kv API_HOST "0.0.0.0"
  update_env_kv API_PORT "3000"

  # ALLOWED_ORIGINS
  if [[ -n "$DOMAIN" ]]; then
    update_env_kv ALLOWED_ORIGINS "https://${DOMAIN},https://t.me"
    update_env_kv SERVER_PUBLIC_URL "https://${DOMAIN}"
    update_env_kv WEBAPP_URL "https://${DOMAIN}"
  fi

  # אסימוני טלגרם אם סופקו
  [[ -n "$TELEGRAM_BOT_TOKEN" ]] && update_env_kv TELEGRAM_BOT_TOKEN "$TELEGRAM_BOT_TOKEN"
  [[ -n "$TELEGRAM_PAYMENT_PROVIDER_TOKEN" ]] && update_env_kv TELEGRAM_PAYMENT_PROVIDER_TOKEN "$TELEGRAM_PAYMENT_PROVIDER_TOKEN"

  log ".env מוכן (סודות לא נשמרים בגיט)."
}

compose_up() {
  cd "$APP_DIR"
  log "Build & Up ל-Docker Compose…"
  docker compose build --pull
  docker compose up -d
  docker compose ps
}

issue_tls_and_patch_nginx() {
  if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
    warn "DOMAIN/EMAIL לא הוגדרו – מדלג על TLS (האתר ירוץ ב-HTTP)."
    return 0
  fi

  cd "$APP_DIR"

  # מוודא שהסטאק למעלה בשביל HTTP-01
  log "בודק שה-Nginx למעלה ונגיש ב-HTTP…"
  sleep 3
  if ! curl -fsS "http://${DOMAIN}/healthz" >/dev/null 2>&1; then
    warn "לא הצלחנו לגשת ל-http://${DOMAIN}/healthz — ננסה להמשיך בכל זאת להוצאת תעודה."
  fi

  # יוצר volumes בשם הפרויקט (כפי שמוגדר ב-compose)
  docker volume create "${CERTS_VOLUME}" >/dev/null
  docker volume create "${WEBROOT_VOLUME}" >/dev/null

  log "מוציא תעודת Let's Encrypt (HTTP-01, webroot)…"
  docker run --rm \
    -v "${WEBROOT_VOLUME}:/var/www/certbot" \
    -v "${CERTS_VOLUME}:/etc/letsencrypt" \
    certbot/certbot certonly --webroot -w /var/www/certbot \
    -d "${DOMAIN}" --agree-tos -m "${EMAIL}" --non-interactive

  # מוודא שהקובץ conf כולל בלוק 443 + רידיירקט
  if ! grep -q "listen 443 ssl" conf/nginx/sites-enabled/app.conf; then
    log "מוסיף בלוק TLS (443) ל-conf/nginx/sites-enabled/app.conf…"
    cat >> conf/nginx/sites-enabled/app.conf <<EOF

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN};

  ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
  ssl_session_cache   shared:SSL:10m;
  ssl_session_timeout 1d;
  ssl_protocols       TLSv1.2 TLSv1.3;
  ssl_ciphers         HIGH:!aNULL:!MD5;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  root  /usr/share/nginx/html;
  index index.html;

  # ACME challenge (גם ב-443 לא יזיק)
  location ^~ /.well-known/acme-challenge/ {
    alias /var/www/certbot/.well-known/acme-challenge/;
    default_type "text/plain";
    allow all;
  }

  location = /healthz {
    add_header Content-Type application/json always;
    return 200 '{"status":"ok"}';
  }

  add_header X-Content-Type-Options nosniff always;
  add_header X-Frame-Options SAMEORIGIN always;
  add_header Referrer-Policy no-referrer-when-downgrade always;
  add_header X-XSS-Protection "1; mode=block" always;

  location ~* \.(?:js|mjs|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$ {
    expires 7d;
    access_log off;
    try_files \$uri =404;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  location /api/ {
    limit_req zone=api_rps burst=60 nodelay;
    limit_conn api_conns 200;

    proxy_http_version 1.1;
    proxy_set_header Host              \$host;
    proxy_set_header X-Real-IP         \$remote_addr;
    proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    proxy_connect_timeout 5s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;

    proxy_pass http://api_upstream;
  }

  location /socket.io/ {
    limit_req zone=api_rps burst=120 nodelay;
    limit_conn api_conns 1000;

    proxy_http_version 1.1;
    proxy_set_header Upgrade           \$http_upgrade;
    proxy_set_header Connection        \$connection_upgrade;
    proxy_set_header Host              \$host;
    proxy_set_header X-Real-IP         \$remote_addr;
    proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;

    proxy_read_timeout 3600s;
    proxy_send_timeout 120s;
    proxy_buffering off;

    proxy_pass http://api_upstream/socket.io/;
  }
}

# הפניית HTTP->HTTPS לדומיין (עם חריג ל-ACME)
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN};

  location ^~ /.well-known/acme-challenge/ {
    alias /var/www/certbot/.well-known/acme-challenge/;
    default_type "text/plain";
    allow all;
  }

  return 301 https://\$host\$request_uri;
}
EOF
  fi

  log "טוען מחדש את Nginx עם הקונפיג המעודכן…"
  docker compose exec -T nginx nginx -t
  docker compose exec -T nginx nginx -s reload

  log "יוצר cron ל- renew יומי (בשעה 03:00)…"
  cat >/etc/cron.d/${PROJECT_NAME}-certbot-renew <<CRON
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 3 * * * root docker run --rm -v ${WEBROOT_VOLUME}:/var/www/certbot -v ${CERTS_VOLUME}:/etc/letsencrypt certbot/certbot renew --quiet && docker compose -f ${APP_DIR}/docker-compose.yml exec -T nginx nginx -s reload
CRON
}

summary() {
  log "הקמה הושלמה."
  echo "------------------------------------------------------------"
  echo "מיקום הפרויקט:     ${APP_DIR}"
  echo "Docker Compose:     docker compose -f ${APP_DIR}/docker-compose.yml ps"
  echo "קובץ env:          ${APP_DIR}/.env"
  echo "דומיין:            ${DOMAIN:-<לא הוגדר>}"
  echo "בדיקת בריאות:"
  echo "  HTTP :  curl -I http://${DOMAIN:-<IP>}/healthz"
  [[ -n "$DOMAIN" ]] && echo "  HTTPS:  curl -I https://${DOMAIN}/api/health"
  echo "יומנים:            docker compose -f ${APP_DIR}/docker-compose.yml logs -f --tail=200"
  echo "תעודות TLS:        docker volume inspect ${CERTS_VOLUME} (בתוך Nginx כ-/etc/letsencrypt)"
  echo "------------------------------------------------------------"
}

main() {
  require_root
  install_docker
  setup_ufw
  tune_sysctl
  clone_repo
  prepare_env_file
  compose_up
  issue_tls_and_patch_nginx
  summary
}

main "$@"
