FROM node:20-bullseye AS build
WORKDIR /app

# התקנת תלויות (כולל dev) לבילד
COPY package.json ./
RUN npm install

# קומפילציה
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# הסרת devDeps לפני העברה ל-runtime
RUN npm prune --omit=dev

# ---- Runtime ----
FROM node:20-bullseye
WORKDIR /app
ENV NODE_ENV=production

# רק prod node_modules + קוד קומפילד
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node","dist/index.js"]
