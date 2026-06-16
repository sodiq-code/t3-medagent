# T3 MedAgent — Railway Deployment
# Bun runs TypeScript natively, no compile step needed for the server
FROM oven/bun:latest

WORKDIR /app

# Copy manifests for install caching
COPY package.json bun.lock ./
COPY packages/web/package.json ./packages/web/
COPY packages/t3n-sdk/package.json ./packages/t3n-sdk/

# Install all dependencies
RUN bun install

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
