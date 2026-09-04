# Day Story — Run Your Day

A 2D platformer diary. You log your day — as free text, a timestamped format,
a tap-in timeline, or an ordered list of moments — and it turns into a small
Mario-style level you run and jump through in a couple of minutes. Each
activity you did becomes a collectible station; unrecorded time becomes an
honest "black box" you still run past.

## Stack

A MERN app: **M**ongoDB, **E**xpress, **R**eact (Vite), **N**ode.

- `client/` — React frontend. The three input modes, the canvas platformer
  engine, and the save/complete flow, ported from an earlier single-file
  HTML version (still viewable at `index.html` in this repo / in git
  history) onto real components.
- `server/` — Express API with JWT auth (register/login) and MongoDB
  (via Mongoose) for persisting each user's saved days.

Accounts are real now: each saved day is scoped to your logged-in user via
a JWT, replacing the old artifact-only `window.storage` approach (which only
worked inside a Claude.ai artifact).

## Running it locally

Requires Node 18+ and a MongoDB connection (local `mongod`/Docker, or an
Atlas cluster).

```bash
npm install                      # installs both client/ and server/ (npm workspaces)
cp server/.env.example server/.env
# edit server/.env: set MONGO_URI (and JWT_SECRET to something real)
npm run dev                       # runs server (:4000) and client (:5173) together
```

Then open `http://localhost:5173`, register an account, and play.

Registration sends a verification email and "Forgot your password?" sends a reset
email; leave `SMTP_HOST` unset in `server/.env` for local dev and both just log the
link to the server console instead of actually sending mail. Set `SMTP_HOST` /
`SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` to send for real. Neither
flow blocks registering or logging in — an unverified email is tracked but not
enforced.

`run.sh` is a convenience wrapper around the same `npm run dev` that also
installs dependencies on first run. It also forwards to the lint/format
scripts below: `./run.sh lint`, `./run.sh lint:fix`, `./run.sh format`,
`./run.sh format:check`.

### Linting & formatting

```bash
npm run lint            # ESLint across client/ and server/
npm run lint:fix
npm run format           # Prettier, writes changes
npm run format:check     # Prettier, check only (CI-friendly)
```

### Tests

```bash
npm test                 # Vitest, runs once (client + server)
npm run test:watch       # Vitest in watch mode
npm run test -w client   # just the client suite
npm run test -w server   # just the server suite
```

Server tests mock the Mongoose models rather than needing a real MongoDB —
see `server/src/controllers/auth.controller.test.js` for the pattern.

## Production / deployment

`npm run dev` above is local-dev only (hot reload, no build). For building
the client, running the server in production, containerizing with Docker,
and configuring MongoDB/env vars for a real deployment, see `DEPLOY.md`.

CI (`.github/workflows/ci.yml`) runs `format:check`, `lint`, the client
build, and the test suite on every push/PR to `main`.

## Input modes (current)

1. **Log it as cards** — one card per activity: duration (h/m), a short
   title, an optional note, a category (drives the card's accent color),
   and free-form tags with autocomplete. Cards stack in entry order and are
   editable/deletable; a running total shows how much of the 24h is still
   unaccounted for.
2. **Build it on a timeline** — pick an activity, tap the half-hour slots you
   spent on it, 00:00 to 24:00. Untapped slots stay black box.
3. **List your moments in order** — add what you did, one at a time, top to
   bottom. A time is optional per moment; order is what matters.

All three feed the same platformer engine and the same end-of-run recap and
save flow.

**Modes 2 and 3 are still slated for replacement.** The agreed next design
drops the timeline-tap and moments-list modes for a drag-to-block timeline
builder, and adds two review modes (a Pokémon-dialogue-style recap, and a
day/night "chrono bar" timeline) alongside the platformer run — see
`TODO.md` → "Feature: entry & review redesign" for the full spec. Mode 1
above (log cards) is that redesign's first entry mode, already built.

## Saving days

"Save This Day" calls `PUT /api/days/:date` on the server (JWT-authenticated),
which upserts a `Day` document scoped to your account — re-saving the same
date overwrites rather than duplicating. Days are private per account.

No open known issues from code review at the moment — see git history for
past fixes (auth email resolution, error-message leakage, local-date save
bug, JWT algorithm pinning, `levelBuilder.js` dedup).

See `TODO.md` for the entry/review redesign spec (the main thing planned
next) and any other tracked gaps.

## Ideas for next steps

- A "My Days" screen using the already-built `GET /api/days` list endpoint
- A "replay a past saved day" mode, using `GET /api/days/:date`
- Export a finished recap as an image to share
- Obstacles/enemies for extra platforming challenge, if the platformer
  recap survives the redesign in `TODO.md` (undecided — it may be fully
  replaced by the dialogue recap described there)
