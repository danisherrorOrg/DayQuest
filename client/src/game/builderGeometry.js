// Pure geometry helpers for the timeline-builder drag interactions
// (TimelineBuilderScreen). Kept separate from the component so the
// clamping/snapping math — the part most worth getting exactly right — can
// be unit tested without simulating pointer events.

export const DAY_MINUTES = 1440;

export function snapMinutes(mins, snapTo) {
  return Math.round(mins / snapTo) * snapTo;
}

export function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

// The [lo, hi] window a block anchored at `anchor` (a point in minutes) may
// occupy before it would overlap a sibling block. `excludeId` leaves out the
// block currently being moved/resized so it doesn't block itself.
export function neighborBounds(blocks, anchor, excludeId = null) {
  let lo = 0;
  let hi = DAY_MINUTES;
  for (const b of blocks) {
    if (b.id === excludeId) continue;
    if (b.end <= anchor && b.end > lo) lo = b.end;
    if (b.start >= anchor && b.start < hi) hi = b.start;
  }
  return { lo, hi };
}

export function sortByStart(blocks) {
  return [...blocks].sort((a, b) => a.start - b.start);
}
