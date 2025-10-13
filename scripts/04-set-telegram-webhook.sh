#!/usr/bin/env bash
set -euo pipefail
ROOT="/root/backgammon-mini-app"
source "$ROOT/api-v2.env"
: "${TELEGRAM_BOT_TOKEN:?missing}"
: "${APP_BASE_URL:?missing}"
: "${TELEGRAM_WEBHOOK_SECRET:?missing}"
URL="${APP_BASE_URL}/api/v2/payments/telegram/webhook"
echo "🔗 setWebhook => ${URL}"
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=${URL}" \
  -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  -d 'allowed_updates=["message","pre_checkout_query"]' | sed -e 's/^{/\\n&/'
echo "ℹ️ getWebhookInfo"
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | sed -e 's/^{/\\n&/'
