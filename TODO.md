# TODO / Pending Work

Everything from the initial project audit (tests, lint/format, security
hardening, offline handling, CI, Docker, deploy docs, responsive layout)
is done, as is most of the entry & review redesign (structured log cards
and drag-to-block timeline replacing the old free-text/tap-slot modes; a
dialogue recap and day/night chrono bar replacing the `GameScreen`
platformer run) — see git history for the individual fixes. What's left is
the feature work below.

## Feature: multiple entries per day (design decided, not built)

`Day` currently has a unique `{user, date}` index
(`server/src/models/Day.js`) and `PUT /api/days/:date`
(`server/src/controllers/days.controller.js`) always upserts by fully
replacing the document — saving the same date twice overwrites the first
save instead of adding to it. Users should be able to log more than once
for the same date (e.g. log the morning, come back later and log the
afternoon) without losing what's already there.

Decided shape — keep one `Day` document per `{user, date}` (no schema or
index change, no new endpoint) and push the merge to the client, since
`PUT` already just replaces with whatever full list it's sent:

- [ ] On opening an entry mode for a date that already has a saved day,
      `GET /api/days/:date` first and seed the screen's list state
      (`logCards` / `timelineBlocks` / `moments`) with what's already
      saved, instead of starting blank. "Save" then sends the same full
      list `PUT` as today (old items + newly added ones together) — no
      server-side change needed.
- [ ] **Log cards**: seed `LogCardModeScreen` with the existing `logCards`
      on mount; new cards just extend the list (duration-based, so no
      collision is possible).
- [ ] **Timeline builder**: seed `TimelineBuilderScreen` via its existing
      `initialBlocks` prop (already built for the chrono-bar "jump to
      builder" feature) with the existing `timelineBlocks`; the existing
      `neighborBounds` overlap logic then naturally stops a new drag from
      overlapping something logged earlier the same day — no new
      validation code needed.
- [ ] **Moments**: same seed-on-open treatment (simple append), though low
      priority since this mode is separately slated for removal (see
      "Other tracked gaps" below).
- [ ] **Mode mismatch**: if the fetched day's `mode` differs from the entry
      mode being opened (e.g. today was logged with cards, user opens the
      timeline builder), don't attempt cross-mode merging — show a confirm
      dialog ("You already logged today with Log Cards — switching to
      Timeline Builder will replace that entry. Continue?"); confirmed →
      today's existing overwrite behavior, unchanged.
- [ ] No change needed to `GET`/`PUT /api/days/:date` or to either review
      mode (dialogue recap, chrono bar) — both still build from exactly
      one document per date.

## Other tracked gaps

- [ ] **Drop the moments-list entry mode** — the redesign's agreed shape was
      two entry modes (log cards, timeline builder) replacing all three
      old modes, but `MomentsModeScreen` was never actually removed and is
      still offered/used in `App.jsx` and `dayRecap.js` alongside the two
      new modes.
- [ ] **"My Days" list screen** — `GET /api/days` (`listDays`) already
      exists server-side but nothing in the client calls it; there's
      currently no way to browse previously saved days.
- [ ] **Replay a past saved day** — `GET /api/days/:date` (`getDay`) is
      also unused; no UI reopens an old day in either review mode.
- [ ] **Delete a saved day** — no delete endpoint or UI exists.
- [ ] **Export a finished recap as an image**, to share outside the app.
- [ ] **Account management** — no change-password-while-logged-in and no
      delete-account/settings screen; only register/login/forgot-password/
      reset-password/verify-email exist today (`auth.routes.js`).
- [ ] **Stats/trends across saved days** — each day gets a per-category
      summary, but nothing aggregates across days (e.g. "this week you
      spent most time on Work").
- [ ] **Component/UI tests** — only pure-logic modules (`builderGeometry.js`,
      `dayRecap.js`) are unit-tested; there are no tests for the
      pointer-drag timeline interactions, dialogue box, or chrono bar
      components (see `client/CLAUDE.md`).
- [ ] **Vertical chrono-bar layout** — the original chrono-bar spec allowed
      a vertical option for wide/tall screens; only horizontal shipped.
- [ ] **Offline-first draft saving** — `OfflineBanner`/`useOnlineStatus`
      detect connectivity, but there's no local draft queue/retry; going
      offline mid-entry just blocks the save.
- [ ] **PWA support** — no manifest or service worker for a
      mobile-friendly, daily-use app.
- [ ] **Reminders/notifications** to log the day — SMTP is already wired
      up for verification/reset emails but nothing nudges users to log.

## Verified fine (not gaps)

- `.gitignore` already covers `node_modules/`, `dist/`, `.env`.
- `server/.env.example` matches the `process.env.*` vars actually read in
  code (`MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`).
- Day-save input validation (`days.controller.js`) already checks date
  format and the `mode` enum properly.

---

See also `README.md` for what's currently built and how it works.
