
FROM node:22-bookworm-slim

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev

COPY --chown=node:node . .

RUN npx prisma generate \
    && mkdir -p uploads \
    && chown node:node uploads

USER node

EXPOSE 4000

CMD ["node", "src/server.js"]
