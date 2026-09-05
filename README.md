# Day Story — Run Your Day

A day diary that replays your logged day as a retro dialogue-box walkthrough,
Pokémon-NPC style. You log your day — as a card per activity, or a
drag-to-block timeline — and then step through it one page at a time: a
page per activity (time, title, category, note), plus a "black box" filler
page for any unrecorded stretch, so unlogged time is acknowledged rather
than hidden.

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

Both feed the same review screens and save flow. An earlier third mode
("list your moments in order") was dropped — see `TODO.md` for the note; a
day saved under it before the drop still opens fine in either review mode,
just with nothing to show but black box.

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
`levelBuilder.js`) has been removed.

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

Finishing either review mode opens an end-of-day summary (total tracked
hours, breakdown by category) with the same Save/Start Over flow.

## Saving days

"Save This Day" calls `PUT /api/days/:date` on the server (JWT-authenticated),
which upserts a `Day` document scoped to your account: one document per day,
still fully replaced on every save. Opening an entry mode for a date you've
already logged today seeds it with what's already saved, so a second
session the same day adds to the first instead of losing it — picking a
different entry mode than the one already saved warns you first, since the
switch replaces rather than merges. Days are private per account.

No open known issues from code review at the moment — see git history for
past fixes (auth email resolution, error-message leakage, local-date save
bug, JWT algorithm pinning, and the pre-removal `levelBuilder.js` dedup).

## Browsing past days

A "My Days" link on the mode-select screen opens a newest-first list of
every day you've saved (`GET /api/days`), showing the date and the summary
line generated when it was saved. Tapping "▶ view recap" on any of them
replays that day in either review mode (dialogue or chrono bar), same as a
day you just finished logging — just without a Save button, since it's
already saved. "✕ delete" permanently removes a day (`DELETE
/api/days/:date`) after a confirm step.

Above the list, a "This Week" / "All Time" toggle shows aggregate stats
across your saved days: days logged, total time tracked, and a
category-by-category breakdown (e.g. how much of the week went to Work vs.
Gym) — computed client-side from the same list, no separate endpoint.

## Account management

A "Settings" link next to "My Days" opens a screen to change your password
(`POST /auth/change-password`, requires the current password) or
permanently delete your account and every saved day (`DELETE
/auth/account`, also requires your password, behind a confirm step).

See `TODO.md` for tracked gaps and planned feature work — exporting a
recap as an image, offline draft saving, and more.
