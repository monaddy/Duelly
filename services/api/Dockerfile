FROM node:20-alpine

RUN apk add --no-cache wget openssl

# בסיס
WORKDIR /app

# PM2 config
COPY pm2 /app/pm2

# התקנת תלויות לשירות
COPY services/api/package.json /app/services/api/package.json
RUN npm --prefix /app/services/api install --omit=dev

# העתקת הסכימה
COPY prisma /app/prisma

# קוד השירות
COPY services/api /app/services/api

# עבודה מתוך תיקיית השירות
WORKDIR /app/services/api
ENV NODE_ENV=production
EXPOSE 3000

# יצירת Prisma Client בתוך node_modules של השירות
RUN npx --yes prisma generate --schema=/app/prisma/schema.prisma

# הרצה ישירה של pm2-runtime מתוך node_modules (ללא npx/רשת)
CMD ["./node_modules/.bin/pm2-runtime", "/app/pm2/ecosystem.config.cjs"]
