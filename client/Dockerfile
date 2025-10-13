FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && npm ci && npm run build

FROM alpine AS artifact
WORKDIR /out
COPY --from=build /app/dist/ ./dist/
