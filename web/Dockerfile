# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG REACT_APP_API_BASE_URL=http://localhost:5001/api
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV SKIP_PREFLIGHT_CHECK=true
ENV CI=false

RUN npm run build

# ── Production stage (nginx) ─────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
