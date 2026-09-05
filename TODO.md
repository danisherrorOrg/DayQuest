# TODO / Pending Work

Everything from the initial project audit (tests, lint/format, security
hardening, offline handling, CI, Docker, deploy docs, responsive layout)
is done, as is most of the entry & review redesign (structured log cards
and drag-to-block timeline replacing the old free-text/tap-slot modes; a
dialogue recap and day/night chrono bar replacing the `GameScreen`
platformer run) and the multiple-entries-per-day feature below — see git
history for the individual fixes. What's left is the tracked gaps further
down.

## Feature: multiple entries per day (done)

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

- [x] ~~On opening an entry mode for a date that already has a saved day,
      `GET /api/days/:date` first and seed the screen's list state
      (`logCards` / `timelineBlocks` / `moments`) with what's already
      saved, instead of starting blank. "Save" then sends the same full
      list `PUT` as today (old items + newly added ones together) — no
      server-side change needed.~~ Fixed: new `useTodayEntry` hook
      (`client/src/hooks/useTodayEntry.js`) fetches `GET /api/days/:date`
      for today (`todayDateString()`, extracted from `useDaySave.js` into
      the new `client/src/game/date.js`) once on mount and hands back
      whatever's already saved, or `null` on a 404/offline/any other
      failure — the screen just starts blank in that case, same as before.
      `saveDay`/`PUT` itself is untouched.
- [x] ~~**Log cards**: seed `LogCardModeScreen` with the existing
      `logCards` on mount; new cards just extend the list (duration-based,
      so no collision is possible).~~ Fixed: seeded once (a `seededRef`
      guards against re-seeding over in-progress edits) when
      `todayEntry.mode === "cards"`, with a fresh client-side `id` per
      card since the server doesn't store one. A "Picking up where you
      left off today" line appears when seeded, so the pre-filled list
      doesn't look unexplained.
- [x] ~~**Timeline builder**: seed `TimelineBuilderScreen` ... with the
      existing `timelineBlocks`; the existing `neighborBounds` overlap
      logic then naturally stops a new drag from overlapping something
      logged earlier the same day.~~ Fixed, but _not_ via the existing
      `initialBlocks` prop — that prop is reserved for the chrono-bar
      "jump to builder" shortcut, which already carries this run's own
      in-memory blocks (more current than the server copy) and must win
      when both are present. Seeding from `todayEntry` only runs when
      `initialBlocks`/`initialAnchorMinutes` are empty, i.e. a plain open
      from `ModeSelectScreen`. Once seeded, `neighborBounds` treats the
      loaded blocks as ordinary siblings, so a new drag can't overlap them
      — no new validation code needed.
- [x] ~~**Moments**: same seed-on-open treatment (simple append)~~ Fixed,
      same pattern as the other two, despite this mode being separately
      slated for removal (see "Other tracked gaps" below).
- [x] ~~**Mode mismatch**: if the fetched day's `mode` differs from the entry
      mode being opened (e.g. today was logged with cards, user opens the
      timeline builder), don't attempt cross-mode merging — show a confirm
      dialog ("You already logged today with Log Cards — switching to
      Timeline Builder will replace that entry. Continue?"); confirmed →
      today's existing overwrite behavior, unchanged.~~ Fixed:
      `ModeSelectScreen` now calls `useTodayEntry()` itself and intercepts a
      mode-card click — if today's saved `mode` differs from the picked
      mode (mapped via `SCREEN_TO_MODE`, since the "timeline"/"moments"
      screen names don't match their `builder`/`sequence` day-mode values),
      it shows a confirm dialog (reusing the existing
      `.builderPopupBackdrop`/`.builderPopupSheet` popup styling) before
      navigating; canceling stays on `ModeSelectScreen`, confirming
      navigates as before, where the picked entry screen's own
      `useTodayEntry()` mode check already skips seeding and today's
      existing full-replace `PUT` behavior takes over unchanged.
- [x] ~~No change needed to `GET`/`PUT /api/days/:date` or to either review
      mode (dialogue recap, chrono bar) — both still build from exactly
      one document per date.~~ Confirmed: neither endpoint nor either
      review builder was touched.

## Other tracked gaps

- [x] ~~**Drop the moments-list entry mode** — the redesign's agreed shape
      was two entry modes (log cards, timeline builder) replacing all three
      old modes, but `MomentsModeScreen` was never actually removed and is
      still offered/used in `App.jsx` and `dayRecap.js` alongside the two
      new modes.~~ Fixed: `MomentsModeScreen.jsx` deleted, along with its
      `App.jsx` wiring, `ModeSelectScreen`'s third mode card, the
      moments-specific paths in `dayRecap.js`
      (`pagesFromMoments`/`segmentsFromMoments`) and `activities.js`
      (`guessActivityFromText`, unused once those were gone), the `moments`
      prop threaded through both review screens and `useDaySave`, and the
      now-orphaned moments-mode CSS. The server keeps `"sequence"` in the
      `Day` mode enum (`server/src/models/Day.js`,
      `days.controller.js`) purely so a day saved before this change still
      round-trips; `buildDayPages`/`buildDaySegments` render any day with a
      mode that has no entry screen anymore (`"sequence"`, `"timed"`,
      `"legacy"`) as a fully black-box day, and `ModeSelectScreen`'s
      mode-mismatch dialog names all three generically ("an earlier version
      of today's entry") since none of them can be picked again.
- [x] ~~**"My Days" list screen** — `GET /api/days` (`listDays`) already
      exists server-side but nothing in the client calls it; there's
      currently no way to browse previously saved days.~~ Fixed: new
      `MyDaysScreen` (`client/src/components/screens/MyDaysScreen.jsx`),
      opened via a "My Days" link next to "Log out" on `ModeSelectScreen`.
      Calls the already-existing `listDays()` (`client/src/api/days.js`,
      already used elsewhere for tag-autocomplete seeding) and lists every
      saved day newest-first (the server already sorts by `date desc`),
      showing the date (new `formatDisplayDate` in `client/src/game/date.js`),
      a mode badge, and the day's stored `summary` sentence — reusing that
      already-saved text instead of recomputing a breakdown client-side, so
      it works uniformly even for a day saved under a retired mode value.
      Read-only for now — opening/replaying or deleting a listed day are
      the next two tracked gaps below.
- [x] ~~**Replay a past saved day** — `GET /api/days/:date` (`getDay`) is
      also unused; no UI reopens an old day in either review mode.~~ Fixed,
      though not via `getDay` — `MyDaysScreen` already has the full day from
      `listDays()`, so its new "▶ view recap" button hands that straight to
      a new `handleReplayDay` in `App.jsx`, which opens
      `DialogueRecapScreen`/`ChronoBarScreen` exactly like a freshly-built
      run, plus a new `replay` prop threaded through both (and
      `DayCompleteOverlay`'s new `showSave`/`restartLabel` props) that hides
      the Save button, relabels "Start Over" to "Back to My Days", drops the
      chrono bar's "tap to jump into the builder" shortcut, and adds a
      "← Back to My Days" link so you're not forced to page through a whole
      day to leave. `useDaySave` still hardcodes today's date, so hiding
      Save during replay isn't just cosmetic — clicking it would silently
      overwrite today's entry with the replayed day's data.
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
