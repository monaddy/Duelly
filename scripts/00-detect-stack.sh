#!/usr/bin/env bash
set -euo pipefail

ROOT="/root/backgammon-mini-app"
cd "$ROOT"

echo "📂 ROOT: $ROOT"
test -f docker-compose.yml || { echo "❌ חסר docker-compose.yml"; exit 1; }
test -d conf/nginx || { echo "❌ חסרה תיקיית conf/nginx"; exit 1; }

echo "🔎 checking compose services..."
docker compose ps >/dev/null

echo "🔎 networks..."
docker network ls | grep -E 'public|private' >/dev/null || \
  echo "⚠️ רשתות public/private לא זוהו ברמת docker (ייתכן שמוגדרות ב-compose בלבד)"

echo "✅ זיהוי בסיסי הושלם"
