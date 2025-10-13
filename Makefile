SHELL := /bin/bash
DC     := docker compose

.PHONY: help build up down restart logs ps api-sh nginx-reload db-migrate db-studio test certbot-init certbot-renew dhparam

help:
	@echo "Available targets:"
	@echo "  build           Build Docker images"
	@echo "  up              Start stack (detached)"
	@echo "  down            Stop & remove stack"
	@echo "  restart         Restart the stack"
	@echo "  logs            Tail logs"
	@echo "  ps              Show container status"
	@echo "  api-sh          Shell into API container"
	@echo "  nginx-reload    Reload Nginx config"
	@echo "  db-migrate      Run Prisma migrations (if present)"
	@echo "  db-studio       Open Prisma Studio (interactive)"
	@echo "  test            Run API tests"
	@echo "  certbot-init    Obtain Let's Encrypt cert (set DOMAIN=...)"
	@echo "  certbot-renew   Renew Let's Encrypt certs"
	@echo "  dhparam         Generate dhparam.pem"

build:
	$(DC) build --pull

up:
	$(DC) up -d

down:
	$(DC) down

restart:
	$(DC) down
	$(DC) up -d

logs:
	$(DC) logs -f --tail=200

ps:
	$(DC) ps

api-sh:
	$(DC) exec api sh

nginx-reload:
	$(DC) exec nginx nginx -t
	$(DC) exec nginx nginx -s reload

db-migrate:
	-$(DC) exec -T api sh -lc 'npx --yes prisma migrate deploy 2>/dev/null || echo "Prisma not installed or no migrations"'

db-studio:
	$(DC) exec -T api sh -lc 'npx --yes prisma studio || true'

test:
	$(DC) exec -T api npm test

certbot-init:
	@if [ -z "$$DOMAIN" ]; then echo "Usage: make certbot-init DOMAIN=example.com"; exit 1; fi
	mkdir -p certbot-www certs
	docker run --rm -it \
	  -v $$PWD/certbot-www:/var/www/certbot \
	  -v $$PWD/certs:/etc/letsencrypt \
	  certbot/certbot certonly --webroot -w /var/www/certbot \
	  -d $$DOMAIN --agree-tos -m admin@$$DOMAIN --non-interactive

certbot-renew:
	docker run --rm \
	  -v $$PWD/certbot-www:/var/www/certbot \
	  -v $$PWD/certs:/etc/letsencrypt \
	  certbot/certbot renew --quiet

dhparam:
	@mkdir -p ./dhparam
	openssl dhparam -out ./dhparam/dhparam.pem 2048
