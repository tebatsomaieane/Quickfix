# ──────────────────────────────────────────────
# QuickFix API server image
# Build context is the server/ directory
# (docker-compose.yml sets `context: ./server`; Railway/Render use the
# same directory as the service root).
# ──────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Uploaded media directory (persisted via a named volume in compose /
# a mounted volume on Railway).
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app

EXPOSE 5000

# Uses $PORT when the platform injects one (Railway/Render), else 5000.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT:-5000}/api/health" || exit 1

CMD ["node", "server.js"]
