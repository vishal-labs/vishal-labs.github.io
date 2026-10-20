# syntax=docker/dockerfile:1

# ── build: produce the static export in /app/out ──────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY next.config.ts tsconfig.json ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
# next/font downloads the Google fonts here, so the built site self-hosts them
RUN npm run build

# ── serve: unprivileged nginx, static files only ──────────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
