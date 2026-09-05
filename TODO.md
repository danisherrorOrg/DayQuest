# TODO / Pending Work

Everything from the initial project audit (tests, lint/format, security
hardening, offline handling, CI, Docker, deploy docs, responsive layout) is
done — see git history for the individual fixes. What's left is the feature
work below.

## Feature: entry & review redesign (planned, not started)

This replaces the current three input modes (`WriteModeScreen`,
`TimelineModeScreen`, `MomentsModeScreen`) and the platformer
(`GameScreen`) recap with **two entry modes** and **two review modes**.
Nothing here is implemented yet — this is the agreed shape to build against.
"Category" below means a small fixed set (e.g. Work, Health, Social, Chores,
Learning, Rest) each with an assigned color, reused across both entry modes
and both review modes so an activity's color is consistent everywhere.

### Entry mode 1 — manual log card (replaces `WriteModeScreen`)

- [x] ~~Structured fields instead of a free-text paragraph, one card per
      logged activity.~~ Fixed: `LogCardModeScreen.jsx` replaces the old
      `TextModeScreen.jsx`/`parse.js` free-text flow entirely (both deleted,
      along with the now-dead `buildLevelLegacy`). New "cards" mode
      (`App.jsx`, `buildLevelFromLogCards` in `levelBuilder.js`) has duration
      as two small h/m number inputs combined into total minutes (not a
      start/end clock pair); a required short title; an optional free-text
      log; a category single-select from the existing `ACTIVITIES` fixed set
      (`activities.js`, drives the card's left-border accent color); and a
      free-form multi-tag chip input (Enter/comma to add, backspace to pop
      the last one) with autocomplete pooled from tags used earlier in the
      session and from previously saved "cards"-mode days (via
      `GET /api/days`). Cards stack in entry order, each editable/deletable,
      with a running total of minutes logged vs. how much of the 24h is
      still a black box. Server: `Day` model gained a `logCards` field and
      `"cards"` mode value (`server/src/models/Day.js`,
      `days.controller.js`) so this mode can actually be saved. Not done
      here (left for the other planned pieces): the level built from cards
      lays them out end-to-end with a trailing black-box segment, but the
      card's `log`/`tags` aren't surfaced anywhere in the platformer recap
      yet — they're only persisted. That's for review mode 1/2 below to
      make use of.

### Entry mode 2 — timeline builder (replaces `TimelineModeScreen`)

- [x] ~~A single 0:00–24:00 ruler ... drag-select ... snap to 5 or 15
      min.~~ Fixed: `TimelineBuilderScreen.jsx` replaces the old tap-slot
      `TimelineModeScreen.jsx` (deleted). The ruler is a single horizontal
      track sized to the panel width (no fixed px/min and no scrolling, so
      it works at any viewport width without a scroll-vs-drag conflict);
      pointer drag-select snaps to 15-minute increments. A plain tap (no
      real drag) still creates a minimum 15-minute block, if there's room.
      The clamping/snapping math lives in the new `builderGeometry.js`
      (`snapMinutes`, `clamp`, `neighborBounds`) and is unit-tested there —
      pointer-drag interaction itself isn't (no component tests exist
      anywhere in this repo yet; see `client/CLAUDE.md`).
- [x] ~~On drag release, open a popup ... same field set as the manual log
      card ... or dismiss to keep the block as an untitled/black-box
      span.~~ Fixed: releasing a drag immediately adds the block (with
      `categoryKey: null`, i.e. black box) and opens a bottom-sheet popup
      with title/log/category/tags — the same fields as the log card, all
      optional. Closing the popup (the "Done" button or tapping the
      backdrop) always commits whatever's in the fields, so leaving them
      blank really does just keep the block as an untitled black-box span,
      per spec; a "Remove" button deletes the block outright, for undoing a
      mis-drag.
- [x] ~~Existing blocks are draggable (move) and resizable (drag an edge);
      overlap ... disallowed.~~ Fixed: dragging a block's body moves it,
      dragging a thin strip at either edge resizes it. Chose **disallow**
      over clamp-into-a-smaller-block: bounds are computed once per drag
      from the immediately neighboring blocks (`neighborBounds`) and every
      move/resize is clamped inside that window, so a block can never be
      dragged or resized into a neighbor — no silent double-booking is
      possible by construction, not by after-the-fact validation. A tap
      (no real movement) on a block's body reopens the popup to edit it
      instead of committing a no-op move.
- [x] ~~Untouched time stays visually distinct as black box.~~ Fixed: the
      ruler's own background is the black-box color; a block left without
      a category renders identically (dashed border only, for a click
      target) so "never touched" and "touched but not categorized" both
      read as the same honest black box, per the app's existing framing.
      Not done here: the "can be vertical on wide screens" option
      mentioned in the original ask — only the horizontal ruler is built.

### Review mode 1 — dialogue recap (replaces the `GameScreen` platformer run)

A Pokémon-NPC-style text-box walkthrough of the day instead of running a
level:

- [x] ~~Retro dialogue box docked at the bottom of the screen with a
      typewriter text-reveal; "▼ press to continue" advances one entry at a
      time, chronologically from the day's first logged activity to its
      last.~~ Fixed: `DialogueRecapScreen.jsx` (`#dialogueBox`) reveals the
      current page's text one character at a time; clicking/tapping the box
      (or pressing Space/Enter/→) instantly finishes the reveal on the
      first press and advances to the next page on the next one, same
      "press A to continue" two-step Pokémon convention.
- [x] ~~One "page" per activity: time range, title, category, and the log
      text if present ... Black-box gaps between activities get their own
      filler page ... so unrecorded time is still acknowledged, not
      silently skipped.~~ Fixed: `buildDayPages` in the new
      `client/src/game/dayRecap.js` walks cards/timeline-blocks/moments in
      chronological order and emits one page per activity (time range or
      duration, title, category, log) plus a filler page
      ("...the rest is a mystery.") for every gap, mirroring the gap logic
      the old `levelBuilder.js` used for the platformer's black-box
      segments (now removed — see below).
- [x] ~~Reuse the existing platformer sprite/tile assets for a small
      backdrop or avatar that swaps per category ... instead of building
      new art from scratch.~~ Fixed: `client/src/game/sprites.js` lifts the
      old `engine.js` canvas draw code verbatim (sky gradient, ground band,
      player figure) into shared helpers; `DialogueRecapScreen`'s
      `StageCanvas` redraws that same little scene per page, tinting the
      ground/avatar with the current page's category color (a neutral gray
      for black-box/filler pages) and showing the category emoji as a
      corner badge.
- [x] ~~End-of-day summary screen in the same visual style as the existing
      end-of-run recap (total tracked hours, breakdown by category) instead
      of a "level complete" screen.~~ Fixed: reuses the exact
      `#completeOverlay`/`#badgeRow`/`#timelineRecap`/`.endBtn` markup and
      CSS the platformer's recap used, now fed by `buildDaySummary`
      (total tracked minutes + per-category minutes, largest first) instead
      of a flat list of collected coins. Save/Start Over work the same way.

With this shipped, the platformer run (`GameScreen.jsx`, `engine.js`,
`levelBuilder.js`, the canvas physics constants) has been deleted rather
than kept unused — `App.jsx` now goes straight from an entry mode to
`DialogueRecapScreen`. This resolves the "undecided" note in `README.md`'s
"Ideas for next steps": the platformer did not survive the redesign.

### Review mode 2 — day/night chrono bar

A single line, 0:00 on one end to 24:00 on the other (horizontal by
default; vertical as a later option), used as a full-day visualization:

- [x] ~~Background of the line renders a day/night gradient along its
      length ... plus a small sun/moon glyph that moves along an arc above
      the line to mark current time-of-day.~~ Fixed: `ChronoBarScreen.jsx`
      renders the bar's background as a CSS gradient built from `SKY_STOPS`
      (dark at 0h/24h, warm sunrise/sunset tint at 6h/18h, brightest at
      noon); a `☀️`/`🌙` glyph is positioned above the bar each render from
      the real current wall-clock time (`glyphPosition`), arcing up from
      the bar at sunrise/sunset and peaking above the bar at noon/midnight.
- [x] ~~Logged activities render as colored segments overlaid on the line
      ... with a small marker pin at its start point and its end point.~~
      Fixed: `buildDaySegments` (new, in `dayRecap.js`) turns cards/blocks/
      timed moments into absolute-time segments (cards lay out end-to-end
      from midnight like the dialogue recap does; builder blocks use their
      real start/end; only categorized/timed items are included). Each
      segment renders with a `chronoPin` at each end (a single center pin
      for a moment's point-in-time marker, since moments have no duration).
- [x] ~~Hover (desktop) or tap (mobile) on a segment opens a popup with that
      activity's full info.~~ Fixed: a segment's `onMouseEnter`/`onClick`
      toggle it into `openId` state, showing a floating card (title, time
      range, log, tags) positioned above the bar, clamped in pixels against
      the bar's measured width so it can't run off-screen.
- [x] ~~Untouched stretches of the line stay as plain day/night gradient
      with no segment.~~ Fixed: `buildDaySegments` only emits entries for
      categorized cards/blocks and timed moments — black-box time is just
      uncovered bar, never its own segment. Moments without a recorded time
      have no place on a 0–24 axis at all; they're left off the bar and
      called out in a small note instead of being silently dropped.
- [x] ~~Nice-to-have: clicking empty space on the bar jumps into entry mode
      2 (timeline builder) pre-positioned at that time.~~ Fixed, scoped to
      builder-mode days: `TimelineBuilderScreen` now accepts
      `initialBlocks`/`initialAnchorMinutes` and pre-opens a new block's
      popup at that time on mount. Only wired up when the day being
      reviewed came from the timeline builder (`App.jsx`'s
      `handleJumpToBuilder`), since that's the only entry mode whose data
      shape (blocks) can be carried back in and re-edited without lossily
      reinterpreting cards or moments as blocks.

A `📖 Dialogue` / `🌗 Chrono Bar` switcher (`ReviewTabs.jsx`) toggles
between the two review modes from either screen; both now share a
`useDaySave` hook and `DayCompleteOverlay` component for the end-of-day
summary/save flow (pulled out of `DialogueRecapScreen.jsx`, which owned it
alone before) so "Finish & Save" works the same from either view.

## Verified fine (not gaps)

- `.gitignore` already covers `node_modules/`, `dist/`, `.env`.
- `server/.env.example` matches the `process.env.*` vars actually read in
  code (`MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`).
- Day-save input validation (`days.controller.js`) already checks date
  format and the `mode` enum properly.

---

See also `README.md` → "Ideas for next steps" for smaller, unrelated
feature ideas.
