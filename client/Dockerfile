# Production image for the Day Story client (client/): builds the static
# Vite bundle and serves it with nginx, proxying /api to the `server`
# container (see docker-compose.yml).
# Build from the repo root so npm workspaces resolve correctly:
#   docker build -f client/Dockerfile -t day-story-client .

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
RUN npm ci --workspace=client
COPY client ./client
RUN npm run build --workspace=client

FROM nginx:1.27-alpine AS runtime
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80
