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

## Input modes

1. **Write it out** — type lines like `06:30-07:00 gym`. Gaps between lines
   become black-box time automatically. Plain text with no timestamps also
   works; it falls back to keyword detection across the whole day.
2. **Build it on a timeline** — pick an activity, tap the half-hour slots you
   spent on it, 00:00 to 24:00. Untapped slots stay black box.
3. **List your moments in order** — add what you did, one at a time, top to
   bottom. A time is optional per moment; order is what matters.

All three feed the same platformer engine and the same end-of-run recap and
save flow.

## Saving days

"Save This Day" calls `PUT /api/days/:date` on the server (JWT-authenticated),
which upserts a `Day` document scoped to your account — re-saving the same
date overwrites rather than duplicating. Days are private per account.

## Known issues (from code review)

- ~~`AuthContext` never re-resolves `email` after a page reload with a persisted
  token, so the top bar shows a blank email until the next login.~~ Fixed:
  added `GET /auth/me` and resolve it on mount.
- ~~The generic error handler returned raw `err.message` to clients on every
  500, leaking internal details (e.g. Mongo error text).~~ Fixed: 500s now
  return a generic message; only intentional 4xx messages pass through.
- ~~`GameScreen.handleSave` computed the save date from UTC (`toISOString`)
  instead of the user's local date, so evening play near a UTC day boundary
  could save under the wrong date.~~ Fixed: now uses the local date.
- ~~`jwt.verify()` didn't pin the accepted algorithms.~~ Fixed: now passes
  `{ algorithms: ["HS256"] }` explicitly.
- ~~`levelBuilder.js`'s three `buildLevelFrom*` functions duplicated the
  finish-line (`finalLen`/`flagX`/`levelWidth`) logic.~~ Fixed: extracted into
  a shared `finishLevel` helper.

See also `TODO.md` for infra/tooling gaps (tests, lint, CI, security
hardening, etc.) that don't fit here.

## Ideas for next steps

- A "My Days" screen using the already-built `GET /api/days` list endpoint
- Drag-to-reorder in the moments-list mode (currently uses up/down buttons)
- Exact-minute dragging in the timeline builder (currently 30-min slots)
- Obstacles/enemies for extra platforming challenge
- Export a finished run as an image to share
- A "replay a past saved day" mode, using `GET /api/days/:date`
