# Deploying Day Story

This covers building and running the app in production. For local dev, see
`README.md`.

The app has three pieces to deploy: the **client** (static Vite build), the
**server** (Express API), and **MongoDB**.

## Option A: Docker Compose (recommended for a single host)

Builds and runs all three pieces together (client behind nginx on `:8080`,
API on `:4000`, Mongo in a volume).

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
docker compose up --build -d
```

Open `http://localhost:8080`. Optional email-sending vars (`SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) and `CORS_ORIGIN` can
also go in that `.env` file — see `docker-compose.yml` for the full list and
defaults. Without `SMTP_HOST`, verification/reset emails log to the `server`
container's console instead of sending, same as local dev.

To put this behind a real domain with TLS, put a reverse proxy (e.g. Caddy,
nginx, or your cloud provider's load balancer) in front of the `client`
service on `:8080` and terminate HTTPS there; update `CORS_ORIGIN` to the
public origin.

Images can also be built/run individually:

```bash
docker build -f server/Dockerfile -t day-story-server .
docker build -f client/Dockerfile -t day-story-client .
```

## Option B: Deploy client and server separately

This is the better fit for platforms like Vercel/Netlify (client) +
Render/Fly.io/Railway (server) + MongoDB Atlas (database).

### 1. MongoDB

Use [MongoDB Atlas](https://www.mongodb.com/atlas) (or any managed Mongo).
Create a database user and get a connection string — this becomes
`MONGO_URI` for the server. Note the sandbox caveat in `CLAUDE.md` doesn't
apply outside a Claude Code sandbox; a real deployment host can reach Atlas
normally.

### 2. Server

```bash
npm ci
npm run start -w server    # runs `node src/index.js`, no --watch
```

Set these environment variables wherever the server runs (see
`server/.env.example` for the full list):

- `MONGO_URI` — Atlas (or other) connection string
- `JWT_SECRET` — long random string, different from dev
- `PORT` — defaults to 4000; most PaaS providers inject their own and expect
  the app to read it, which this already does
- `CORS_ORIGIN` — the deployed **client's** origin (e.g.
  `https://dayquest.example.com`); also used as the base URL in
  verification/reset email links
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` — set
  these to actually send verification/reset emails; otherwise they're only
  logged server-side, which is not viable in production

Run it under a process manager (systemd, pm2, or your platform's own
supervisor) so it restarts on crash, and put it behind HTTPS (either the
platform terminates TLS for you, or put a reverse proxy in front of it).

### 3. Client

Build the static assets:

```bash
npm ci
npm run build -w client    # outputs to client/dist
```

`client/dist` is a static site — serve it from any static host (Vercel,
Netlify, Cloudflare Pages, S3+CloudFront, or nginx). Two things it needs
from whatever serves it:

- **SPA fallback**: unknown paths must serve `index.html` (React Router
  handles routing client-side). See `client/nginx.conf` for the nginx form
  of this rule; most static hosts have an equivalent "rewrite all to
  index.html" setting.
- **`/api` reachable**: the client calls relative `/api/...` paths (see
  `client/src/api/http.js`). Either proxy `/api` to the server (as
  `client/nginx.conf` does) or configure the static host to rewrite `/api/*`
  to the server's URL. There's no build-time "API base URL" env var to set —
  the proxy/rewrite is what makes `/api` resolve correctly in prod.

## Health check

`GET /api/health` returns `{ ok: true }` once the server has connected to
MongoDB — point uptime checks / load balancer health checks at it.
