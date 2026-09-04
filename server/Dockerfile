# Production image for the Day Story API (server/).
# Build from the repo root so npm workspaces resolve correctly:
#   docker build -f server/Dockerfile -t day-story-server .

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci --workspace=server --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app ./
COPY server ./server

EXPOSE 4000
USER node
CMD ["node", "server/src/index.js"]
