# Day Story — Run Your Day

A 2D platformer diary. You log your day — as free text, a timestamped format,
a tap-in timeline, or an ordered list of moments — and it turns into a small
Mario-style level you run and jump through in a couple of minutes. Each
activity you did becomes a collectible station; unrecorded time becomes an
honest "black box" you still run past.

## How to run it

`day_story.html` is a single self-contained file — no build step, no server.
Just double-click it (or open it in Chrome/Safari) and play.

The `versions/` folder keeps the earlier iterations for reference:
- `v1_scene_diary.jsx` — the original idea: a static illustrated scene + written
  summary (React component, meant for an environment that can render `.jsx`,
  e.g. a Claude.ai artifact).
- `v2_platformer.html` — first platformer version: free-text input, run/jump,
  collect activity coins, reach the flag.
- `v3_timed_and_timeline.html` — added two structured input modes: a
  timestamped text format (`06:30-07:00 gym`) and a tap-to-paint 24-hour
  timeline, both with automatic "black box" filling for unrecorded time.

`day_story.html` (the current version) adds a third input mode on top of v3:
an ordered, time-optional list of "moments" with a vertical-timeline UI —
for people who don't want to think in clock times at all.

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
as a Claude.ai artifact) — opening `day_story.html` directly in a plain
browser will run the game fine, but the "Save This Day" button will fail
silently since `window.storage` won't exist there.

## Ideas for next steps

- Drag-to-reorder in the moments-list mode (currently uses up/down buttons)
- Exact-minute dragging in the timeline builder (currently 30-min slots)
- Obstacles/enemies for extra platforming challenge
- Export a finished run as an image to share
- A "replay a past saved day" mode
