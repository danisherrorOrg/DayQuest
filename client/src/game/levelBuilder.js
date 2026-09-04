import { BLACKBOX, guessActivityFromText, minutesToLabel } from "./activities.js";
import { GROUND_Y } from "./constants.js";

export const SLOT_COUNT = 48; // 30-min slots across 24h

export function pxForDuration(mins) {
  return Math.max(140, Math.min(460, mins * 3.4));
}

export function timelineFromSlots(slots) {
  const segs = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const act = slots[i] || BLACKBOX;
    const start = i * 30, end = start + 30;
    if (segs.length && segs[segs.length - 1].act.key === act.key) {
      segs[segs.length - 1].end = end;
    } else {
      segs.push({ start, end, act });
    }
  }
  return segs;
}

export function buildLevelFromTimeline(timeline) {
  const segments = [];
  const coins = [];
  let x = 40;
  timeline.forEach((seg, i) => {
    if (i > 0) x += 70 + Math.random() * 35; // physical gap for platforming
    const len = pxForDuration(seg.end - seg.start);
    segments.push({ x1: x, x2: x + len });
    coins.push({
      x: x + len * 0.35, y: GROUND_Y - 78, r: 14, act: seg.act, collected: false, bob: Math.random() * 10,
      timeLabel: minutesToLabel(seg.start) + "–" + minutesToLabel(seg.end),
    });
    x += len;
  });
  const finalLen = 260;
  segments.push({ x1: x, x2: x + finalLen });
  const flagX = x + finalLen - 40;
  return { segments, coins, flagX, levelWidth: x + finalLen + 60 };
}

export function buildLevelFromMoments(list) {
  const segments = [];
  const coins = [];
  let x = 40;
  const DEFAULT_LEN = 280;
  list.forEach((m, i) => {
    if (i > 0) x += 70 + Math.random() * 35;
    let len = DEFAULT_LEN;
    if (m.time != null && list[i + 1] && list[i + 1].time != null && list[i + 1].time > m.time) {
      len = pxForDuration(list[i + 1].time - m.time);
    }
    const act = guessActivityFromText(m.text);
    act.label = act.label || m.text;
    segments.push({ x1: x, x2: x + len });
    coins.push({
      x: x + len * 0.35, y: GROUND_Y - 78, r: 14, act, collected: false, bob: Math.random() * 10,
      timeLabel: m.time != null ? minutesToLabel(m.time) : null,
    });
    x += len;
  });
  const finalLen = 260;
  segments.push({ x1: x, x2: x + finalLen });
  const flagX = x + finalLen - 40;
  return { segments, coins, flagX, levelWidth: x + finalLen + 60 };
}

export function buildLevelLegacy(activities) {
  const segments = [];
  const coins = [];
  let x = 40;
  activities.forEach((act, i) => {
    if (i > 0) x += 70 + Math.random() * 40;
    const len = 260 + Math.random() * 90;
    segments.push({ x1: x, x2: x + len });
    coins.push({ x: x + 70, y: GROUND_Y - 78, r: 14, act, collected: false, bob: Math.random() * 10, timeLabel: null });
    x += len;
  });
  const finalLen = 260;
  segments.push({ x1: x, x2: x + finalLen });
  const flagX = x + finalLen - 40;
  return { segments, coins, flagX, levelWidth: x + finalLen + 60 };
}

export function buildSummary(items) {
  const known = items.filter((a) => a.key);
  if (known.length === 0) return "Today's mostly a black box — that's alright, tomorrow's a new page.";
  const labels = known.map((a) => a.label.toLowerCase());
  let phrase;
  if (labels.length === 1) phrase = labels[0];
  else if (labels.length === 2) phrase = `${labels[0]} and ${labels[1]}`;
  else phrase = `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  const hadUnknown = items.some((a) => !a.key);
  return `You ran through a day of ${phrase}.` + (hadUnknown ? " A few hours stayed a mystery — and that's okay." : "");
}
