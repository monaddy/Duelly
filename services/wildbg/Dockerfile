FROM node:20-alpine

WORKDIR /app

# For healthchecks
RUN apk add --no-cache wget

COPY services/wildbg/server.js /app/server.js

ENV NODE_ENV=production
ENV WILDBG_PORT=9000
EXPOSE 9000

CMD ["node", "server.js"]
