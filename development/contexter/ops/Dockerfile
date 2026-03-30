FROM oven/bun:1-alpine

RUN apk add --no-cache ffmpeg

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy dependency files first (layer caching — only re-install if deps change)
# Note: app/ subdirectory has the real package.json with dependencies
COPY --chown=app:app app/package.json app/bun.lock* ./

# Install dependencies
RUN bun install --production

# Copy application source
COPY --chown=app:app app/src/ ./src/
COPY --chown=app:app app/evaluation/ ./evaluation/
COPY --chown=app:app app/drizzle-pg/ ./drizzle-pg/
COPY --chown=app:app app/tsconfig.json ./

USER app

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
