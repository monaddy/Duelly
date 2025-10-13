FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache wget openssl

COPY pm2 /app/pm2
COPY services/api/package.json /app/services/api/package.json
RUN npm --prefix /app/services/api install --omit=dev
# Prisma schema & client
COPY prisma /app/prisma
RUN npx --yes prisma generate

# API source
COPY services/api /app/services/api

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "pm2-runtime", "/app/pm2/ecosystem.config.cjs"]
