# Day Story — Run Your Day

A day diary that replays your logged day as a retro dialogue-box walkthrough,
Pokémon-NPC style. You log your day — as a card per activity, a drag-to-block
timeline, or an ordered list of moments — and then step through it one page
at a time: a page per activity (time, title, category, note), plus a "black
box" filler page for any unrecorded stretch, so unlogged time is acknowledged
rather than hidden.

## Stack

A MERN app: **M**ongoDB, **E**xpress, **R**eact (Vite), **N**ode.

- `client/` — React frontend: the entry modes, the dialogue-recap review
  screen, and the save/complete flow, ported from an earlier single-file
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
2. **Drag it on a timeline** — drag across a 0–24 ruler to block out time for
   something; a popup lets you add a title, note, category, and tags (all
   optional). Blocks can be moved or resized afterward by dragging their
   body or edges. Untouched time stays black box.
3. **List your moments in order** — add what you did, one at a time, top to
   bottom. A time is optional per moment; order is what matters.

All three feed the same review screens and save flow.

**Mode 3 is still slated for replacement.** The agreed next design drops the
moments-list mode — see `TODO.md` → "Feature: entry & review redesign" for
the full spec. Modes 1 and 2 above are that redesign's two entry modes,
already built; both review modes below are also now built.

## Review modes (current)

A `📖 Dialogue` / `🌗 Chrono Bar` switcher at the top of either screen swaps
between the two review modes below without losing your place; both end in
the same end-of-day summary and Save/Start Over flow.

**Dialogue recap** — a retro, Pokémon-NPC-style text box docked at the
bottom of the screen. Text reveals a character at a time; tapping the box
finishes the current page's reveal, then advances to the next. One page per
logged activity (time range, title, category, note if any), plus a filler
page for every unrecorded gap so the day's "black box" time is acknowledged
rather than skipped. A small canvas backdrop above the box reuses the
original platformer's sky/ground/avatar art, recolored per the current
page's category.

The platformer run this replaced (`GameScreen.jsx`, `engine.js`,
`levelBuilder.js`) has been removed — see `TODO.md` → "Review mode 1" for
what changed.

**Chrono bar** — the whole day as one 0:00–24:00 line, its background a
day/night gradient (dark at both ends, brightest at noon, warm at sunrise/
sunset) with a sun or moon glyph arcing above it to mark the actual current
time-of-day. Logged activities overlay the line as colored segments (color
= category) with a pin marking each segment's start and end; hovering
(desktop) or tapping (mobile) a segment opens its full info — title, time
range, note, tags. Untouched stretches stay plain gradient with no
segment, same "shown honestly, not hidden" black-box framing as elsewhere.
For a day logged with the timeline builder, tapping empty space on the bar
jumps back into that entry mode with a new block pre-opened at that time.
See `TODO.md` → "Review mode 2" for details.

Finishing either review mode opens an end-of-day summary (total tracked
hours, breakdown by category) with the same Save/Start Over flow.

## Saving days

"Save This Day" calls `PUT /api/days/:date` on the server (JWT-authenticated),
which upserts a `Day` document scoped to your account — re-saving the same
date overwrites rather than duplicating. Days are private per account.

No open known issues from code review at the moment — see git history for
past fixes (auth email resolution, error-message leakage, local-date save
bug, JWT algorithm pinning, and the pre-removal `levelBuilder.js` dedup).

See `TODO.md` for the entry/review redesign spec (the main thing planned
next) and any other tracked gaps.

## Ideas for next steps

- A "My Days" screen using the already-built `GET /api/days` list endpoint
- A "replay a past saved day" mode, using `GET /api/days/:date`
- Export a finished recap as an image to share
