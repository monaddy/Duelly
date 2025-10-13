#!/usr/bin/env bash
set -euo pipefail
ROOT="/root/backgammon-mini-app"
ENVFILE="$ROOT/api-v2.env"

DOMAIN="${DOMAIN:-play.duelly.online}"
APP_BASE_URL="https://${DOMAIN}"

# *** שים כאן את הערכים האמיתיים שלך ***
: "${TELEGRAM_BOT_TOKEN:?דרוש TELEGRAM_BOT_TOKEN בסביבה}"
: "${TELEGRAM_PAYMENT_PROVIDER_TOKEN:=TEST:PROVIDER}"
: "${REDIS_PASSWORD:?דרוש REDIS_PASSWORD (Redis מוגן בסיסמה)}"

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
TG_WEBHOOK_SECRET="${TG_WEBHOOK_SECRET:-$(openssl rand -hex 24)}" # header secret_token

cat > "$ENVFILE" <<EOF
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info

APP_BASE_URL=${APP_BASE_URL}
JWT_SECRET=${JWT_SECRET}

# Redis protected
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
# אפשר גם לספק REDIS_URL ישיר במקום הטריפלט לעיל (מנוטרל כברירת מחדל)
# REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

# Telegram
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_PAYMENT_PROVIDER_TOKEN=${TELEGRAM_PAYMENT_PROVIDER_TOKEN}
TELEGRAM_WEBHOOK_SECRET=${TG_WEBHOOK_SECRET}
EOF

echo "✅ נוצר $ENVFILE"
echo "   APP_BASE_URL=$APP_BASE_URL"
echo "   TELEGRAM_WEBHOOK_SECRET (secret_token)=$TG_WEBHOOK_SECRET"
