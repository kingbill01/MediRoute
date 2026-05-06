# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production=false

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate && npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npx prisma generate

COPY --from=builder /app/dist ./dist

# Script de démarrage avec migration auto
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER appuser

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./docker-entrypoint.sh"]
