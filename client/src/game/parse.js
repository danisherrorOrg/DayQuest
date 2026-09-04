import { ACTIVITIES, BLACKBOX, guessActivityFromText } from "./activities.js";

export function parseTimedText(raw) {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const found = [];
  const re = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s+(.+)$/;
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const sh = parseInt(m[1], 10), sm = parseInt(m[2], 10), eh = parseInt(m[3], 10), em = parseInt(m[4], 10);
    const start = sh * 60 + sm;
    let end = eh * 60 + em;
    if (end <= start) end += 1440; // overnight wrap, clamp later
    end = Math.min(end, 1440);
    const desc = m[5].trim();
    const act = guessActivityFromText(desc);
    act.label = act.label || desc;
    found.push({ start, end, act, desc });
  }
  if (found.length === 0) return null;
  found.sort((a, b) => a.start - b.start);
  return fillGapsWithBlackbox(found);
}

export function fillGapsWithBlackbox(segments) {
  const out = [];
  let cursor = 0;
  for (const seg of segments) {
    const s = Math.max(seg.start, cursor);
    if (s > cursor) out.push({ start: cursor, end: s, act: BLACKBOX });
    if (seg.end > s) out.push({ start: s, end: seg.end, act: seg.act });
    cursor = Math.max(cursor, seg.end);
  }
  if (cursor < 1440) out.push({ start: cursor, end: 1440, act: BLACKBOX });
  return out.filter((s) => s.end > s.start);
}

export function detectActivitiesLegacy(text) {
  const lower = text.toLowerCase();
  const found = ACTIVITIES.filter((act) => act.words.some((w) => lower.includes(w)));
  return found.length ? found : [ACTIVITIES[0]];
}
