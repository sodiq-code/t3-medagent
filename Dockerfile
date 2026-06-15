# T3 MedAgent — Railway Deployment
# Bun runs TypeScript natively, no compile step needed for the server
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy manifests for install caching
COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
# Copy any other workspace package.json files that exist
COPY packages/health-contract/package.json ./packages/health-contract/ 2>/dev/null || true

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy full source
COPY . .

# Build the Vite frontend → packages/web/dist
RUN cd packages/web && \
    bunx vite build && \
    (cp -f ../health-contract/health-contract.wasm dist/health-contract.wasm 2>/dev/null || true)

# Railway injects PORT automatically
EXPOSE 3000

# Bun runs TypeScript natively — no build step for the server
CMD ["bun", "packages/web/src/server.ts"]
