# Day Story — Project Guidance

Context and conventions for working on this repo. See `README.md` for the
full feature/product description and `TODO.md` for tracked gaps — this file
is about *how* to work here, not what the app does.

## Overview

A MERN app (MongoDB, Express, React/Vite, Node): you log your day and it
turns into a small platformer level you run through. `client/` is the React
frontend, `server/` is the Express API with JWT auth (access + refresh
tokens) and MongoDB via Mongoose.

## Setup

```bash
npm install                      # installs client/ + server/ (npm workspaces)
cp server/.env.example server/.env
# edit server/.env: set MONGO_URI and JWT_SECRET
npm run dev                       # server :4000 + client :5173 together
```

`./run.sh` wraps `npm run dev`, installs deps on first run, and self-heals
once (clean reinstall) if the dev servers crash on startup — this project has
occasionally hit npm's optional-dependency bug that drops the platform
rollup binary. `./run.sh lint`, `lint:fix`, `format`, `format:check` forward
to the root scripts of the same name.

## MongoDB is not reachable from inside a Claude Code sandbox

`server/.env` in this repo points `MONGO_URI` at a MongoDB Atlas cluster
(`mongodb+srv://...`). **Do not expect this to connect when working inside a
sandboxed environment.** Two independent things break it:

- The sandbox's DNS resolver does not support `SRV` record lookups, so any
  `mongodb+srv://` URI fails immediately with `querySrv ENOTIMP`. A plain
  `mongodb://host:port/db` URI isn't affected by this specific issue, but the
  Atlas cluster itself is still typically unreachable — its network access
  list is IP-based and a sandbox's egress IP is not on it.
- There is no local fallback either: `mongodb-memory-server` (the usual
  no-real-DB workaround) has no community `mongod` build for `aarch64` on
  the Ubuntu releases this sandbox reports, and `apt`/`apt-cache` has no
  `mongodb`/`mongodb-org` package here. Both were confirmed to fail during
  the offline-handling and auth-flow work.

**What this means in practice:** any change touching `server/src/` cannot be
verified with a real end-to-end run (register → login → save a day, etc.)
from inside a sandbox. Verify what you can instead:

- `node --check <file>` for syntax, `npm run lint`, `npm run build -w client`.
- Pure-logic checks that don't need a DB: stub `fetch`/`navigator`/
  `localStorage` and exercise `client/src/api/http.js` directly in a `node -e`
  script (this is how the retry/offline-error logic was verified — see the
  git history around the offline-handling commit for the exact approach).
- A careful manual read of any Mongoose usage, especially around `select:
  false` fields (`refreshTokenHash`, `verificationTokenHash`,
  `resetTokenHash`, `resetTokenExpiresAt`) — prefer the codebase's existing
  `User.updateOne(..., { $unset: {...} })` idiom (see `logout()` in
  `auth.controller.js`) over `doc.field = undefined; doc.save()` for clearing
  those, since the latter's behavior is easy to get subtly wrong and harder
  to verify without a live DB.
- If a real DB run is genuinely required to be confident in a change, say so
  explicitly and ask the user to run it locally (outside the sandbox) rather
  than reporting the change as verified when it wasn't.

## Coding standards / conventions

- ESLint 9 flat config (`eslint.config.js`) + Prettier (`.prettierrc.json`)
  cover both workspaces — run `npm run lint` / `npm run format` before
  considering a change done.
- Server auth code favors small, explicit helpers over abstraction (see
  `auth.controller.js`): token hashing, cookie options, and session issuance
  are each a named function, not a generic "auth service" class.
- Mutating a `select: false` field to clear it goes through `updateOne` +
  `$unset`, not an in-memory `undefined` assignment + `save()` — this is the
  established pattern (`logout()`, `verifyEmail()`, `resetPassword()`).
- Client API errors are plain `Error` objects with a human-readable
  `.message`; forms just render `err.message` directly. A network-layer
  failure (see `client/src/api/http.js`) is tagged `.isNetworkError = true`
  so callers that care (e.g. `GameScreen`'s save button) can special-case it
  without string-matching the message.
- No test framework is set up yet (tracked in `TODO.md`) — don't assume
  `npm test` exists.

## Docs upkeep

`README.md` and `TODO.md` are actively maintained here — when you complete a
tracked gap, check it off in `TODO.md` with a brief note on the fix (matching
the existing `~~struck-through~~` style), and update `README.md` if setup
steps or user-facing behavior changed.
