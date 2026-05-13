# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# OpenSSL pour Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Installer toutes les dépendances (incluant devDependencies pour le build)
COPY package.json ./
COPY prisma ./prisma/

# DATABASE_URL dummy juste pour permettre prisma generate au build
ENV DATABASE_URL=postgresql://dummy:dummy@dummy:5432/dummy
RUN npm install --legacy-peer-deps && ./node_modules/.bin/prisma generate

# Copier le code source et builder
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# OpenSSL pour Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Installer seulement les dépendances de production
COPY package.json ./
COPY prisma ./prisma/

# DATABASE_URL dummy juste pour permettre prisma generate au build
ENV DATABASE_URL=postgresql://dummy:dummy@dummy:5432/dummy
RUN npm install --omit=dev --legacy-peer-deps && \
    ./node_modules/.bin/prisma generate && \
    npm cache clean --force

# Copier le build compilé depuis le builder
COPY --from=builder /app/dist ./dist

# Script de démarrage
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["./docker-entrypoint.sh"]
