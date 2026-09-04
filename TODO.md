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

Structured fields instead of a free-text paragraph, one card per logged
activity:

- [ ] **Duration** — a single `H:MM` field (spinner or two small number
      inputs), not a start/end clock pair — matches how people actually
      think about "I spent 45 min on X."
- [ ] **What you did** — short title, required.
- [ ] **Log** — optional free-text description (this replaces the old
      paragraph, now scoped to one activity instead of the whole day).
- [ ] **Category** — single-select from the fixed set; drives the card's
      left-border/accent color.
- [ ] **Tags** — free-form multi-tag chip input, autocomplete from tags
      used earlier in the same day/previous days.
- [ ] Cards stack in entry order for the day; each is edit/delete-able.
      Total logged duration for the day shown as a running sum so the user
      can see how much of the 24h is still unaccounted for (black box).

### Entry mode 2 — timeline builder (replaces `TimelineModeScreen`)

- [ ] A single 0:00–24:00 ruler (horizontal on mobile, can be vertical on
      wide screens). Replace the fixed 30-min tap-slots with a drag-select:
      click/touch-drag across the ruler to carve out a block of arbitrary
      length (snap to 5 or 15 min, not 30).
- [ ] On drag release, open a popup anchored to the new block with the
      *same field set* as the manual log card (title, log, category, tags),
      all optional except the block's time range, which is already set by
      the drag. User can fill in as much as they want, or dismiss the popup
      to keep the block as an untitled/black-box span.
- [ ] Existing blocks are draggable (move) and resizable (drag an edge);
      overlap either clamps the neighboring block or is disallowed —
      pick one during implementation, don't allow silent double-booking.
- [ ] Untouched time stays visually distinct as black box, consistent with
      the app's existing "honest black box" framing.

### Review mode 1 — dialogue recap (replaces the `GameScreen` platformer run)

A Pokémon-NPC-style text-box walkthrough of the day instead of running a
level:

- [ ] Retro dialogue box docked at the bottom of the screen with a
      typewriter text-reveal; "▼ press to continue" advances one entry at a
      time, chronologically from the day's first logged activity to its
      last.
- [ ] One "page" per activity: time range, title, category, and the log
      text if present (e.g. "6:30–7:00 · GYM — leg day 💪"). Black-box gaps
      between activities get their own filler page (e.g. "...the rest is a
      mystery.") so unrecorded time is still acknowledged, not silently
      skipped.
- [ ] Reuse the existing platformer sprite/tile assets for a small
      backdrop or avatar that swaps per category (home, gym, office, etc.)
      instead of building new art from scratch.
- [ ] End-of-day summary screen in the same visual style as the existing
      end-of-run recap (total tracked hours, breakdown by category) instead
      of a "level complete" screen.

### Review mode 2 — day/night chrono bar

A single line, 0:00 on one end to 24:00 on the other (horizontal by
default; vertical as a later option), used as a full-day visualization:

- [ ] Background of the line renders a day/night gradient along its length
      — dark at both ends (midnight), brightening through sunrise (~6am),
      brightest at noon, dimming through sunset (~6pm), dark again at the
      far end — plus a small sun/moon glyph that moves along an arc above
      the line to mark current time-of-day (sun while it's day, moon while
      it's night). This is a visual echo of the 0–24 axis, not a literal
      clock.
- [ ] Logged activities render as colored segments overlaid on the line
      (color = category), each with a small marker pin at its start point
      and its end point.
- [ ] Hover (desktop) or tap (mobile) on a segment opens a popup with that
      activity's full info (title, time range, log, tags) — same info
      shown in the dialogue recap, different presentation.
- [ ] Untouched stretches of the line stay as plain day/night gradient with
      no segment — the black box, shown honestly rather than hidden.
- [ ] Nice-to-have, not required for a first pass: clicking empty space on
      the bar jumps into entry mode 2 (timeline builder) pre-positioned at
      that time.

## Verified fine (not gaps)

- `.gitignore` already covers `node_modules/`, `dist/`, `.env`.
- `server/.env.example` matches the `process.env.*` vars actually read in
  code (`MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`).
- Day-save input validation (`days.controller.js`) already checks date
  format and the `mode` enum properly.

---

See also `README.md` → "Ideas for next steps" for smaller, unrelated
feature ideas.
