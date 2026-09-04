# Day Story — Run Your Day

A 2D platformer diary. You log your day — as free text, a timestamped format,
a tap-in timeline, or an ordered list of moments — and it turns into a small
Mario-style level you run and jump through in a couple of minutes. Each
activity you did becomes a collectible station; unrecorded time becomes an
honest "black box" you still run past.

## How to run it

`index.html` is a single self-contained file — no build step, no server.
Just double-click it (or open it in Chrome/Safari) and play.

Earlier iterations of this project (a static-scene prototype, then two
progressively more featured platformer versions) are available in the git
history if you want to see how it evolved.

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

The game uses the artifact persistent-storage API (`window.storage`) to save
each day under a `diary:YYYY-MM-DD` key, privately per user. This only works
when the file is opened inside an environment that provides that API (e.g.
as a Claude.ai artifact) — opening `index.html` directly in a plain browser
will run the game fine, but the "Save This Day" button will fail silently
since `window.storage` won't exist there.

## Ideas for next steps

- Drag-to-reorder in the moments-list mode (currently uses up/down buttons)
- Exact-minute dragging in the timeline builder (currently 30-min slots)
- Obstacles/enemies for extra platforming challenge
- Export a finished run as an image to share
- A "replay a past saved day" mode
