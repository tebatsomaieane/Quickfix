# ──────────────────────────────────────────────
# QuickFix API server image
# Build context is the repository root.
#   - Railway:      root context, Dockerfile at server/Dockerfile
#   - Render:       dockerContext ".", dockerfilePath server/Dockerfile
#   - docker-compose: context ".", dockerfile server/Dockerfile
# A root .dockerignore keeps node_modules/dist out of the build context.
# ──────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./

# Uploaded media directory (persisted via a named volume in compose /
# a mounted volume on Railway).
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads

USER app

EXPOSE 5000

# Uses $PORT when the platform injects one (Railway/Render), else 5000.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT:-5000}/api/health" || exit 1

CMD ["node", "server.js"]