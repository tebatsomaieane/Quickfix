# ──────────────────────────────────────────────
# QuickFix API server image
# ──────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Run as a non-root user
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server.js"]