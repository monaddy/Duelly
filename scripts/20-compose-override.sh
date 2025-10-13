#!/usr/bin/env bash
set -euo pipefail
ROOT="/root/backgammon-mini-app"
cat > "$ROOT/docker-compose.override.yml" <<'YAML'
services:
  api_v2:
    build:
      context: ./services/api-v2
    env_file:
      - ./api-v2.env
    depends_on:
      - postgres
      - redis
    networks:
      - private
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
YAML
echo "✅ נוצר $ROOT/docker-compose.override.yml (service: api_v2)"
