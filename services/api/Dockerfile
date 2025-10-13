FROM node:20-alpine

WORKDIR /app

# Minimal tools for healthchecks
RUN apk add --no-cache wget

# Copy PM2 config
COPY pm2 /app/pm2

# Install API dependencies
COPY services/api/package.json /app/services/api/package.json
RUN npm --prefix /app/services/api install --omit=dev

# Copy API source
COPY services/api /app/services/api

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "pm2-runtime", "/app/pm2/ecosystem.config.cjs"]
