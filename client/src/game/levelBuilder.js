import {
  BLACKBOX,
  findActivityByKey,
  formatDuration,
  guessActivityFromText,
  minutesToLabel,
} from "./activities.js";
import { GROUND_Y } from "./constants.js";

export function pxForDuration(mins) {
  return Math.max(140, Math.min(460, mins * 3.4));
}

function finishLevel(segments, x, finalLen = 260) {
  segments.push({ x1: x, x2: x + finalLen });
  return { flagX: x + finalLen - 40, levelWidth: x + finalLen + 60 };
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
      x: x + len * 0.35,
      y: GROUND_Y - 78,
      r: 14,
      act,
      collected: false,
      bob: Math.random() * 10,
      timeLabel: m.time != null ? minutesToLabel(m.time) : null,
    });
    x += len;
  });
  const { flagX, levelWidth } = finishLevel(segments, x);
  return { segments, coins, flagX, levelWidth };
}

// A log card only carries a duration (no absolute clock time), so each one
// simply lays out end-to-end in entry order; any time left under 24h becomes
// one trailing black-box segment, same "honest black box" framing as the
// other modes.
export function buildLevelFromLogCards(cards) {
  const segments = [];
  const coins = [];
  let x = 40;
  let totalMins = 0;

  function pushCoin(act, mins, extra) {
    const len = pxForDuration(mins);
    if (coins.length) x += 70 + Math.random() * 35;
    segments.push({ x1: x, x2: x + len });
    coins.push({
      x: x + len * 0.35,
      y: GROUND_Y - 78,
      r: 14,
      act,
      collected: false,
      bob: Math.random() * 10,
      timeLabel: formatDuration(mins),
      ...extra,
    });
    x += len;
  }

  cards.forEach((card) => {
    const base = findActivityByKey(card.categoryKey) || BLACKBOX;
    const act = { ...base, label: card.title || base.label };
    pushCoin(act, card.durationMins, { log: card.log || "", tags: card.tags || [] });
    totalMins += card.durationMins;
  });

  const remaining = 1440 - totalMins;
  if (remaining > 0) pushCoin(BLACKBOX, remaining);

  const { flagX, levelWidth } = finishLevel(segments, x);
  return { segments, coins, flagX, levelWidth };
}

// Timeline-builder blocks carry explicit start/end minutes but, unlike the
// tap-slot timeline this replaced, don't have to cover the whole day —
// gaps before/between/after them become black-box segments here, the same
// "honest black box" framing as the other modes.
export function buildLevelFromBuilderBlocks(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const segments = [];
  const coins = [];
  let x = 40;
  let cursor = 0;

  function pushCoin(start, end, act, extra = {}) {
    const len = pxForDuration(end - start);
    if (coins.length) x += 70 + Math.random() * 35;
    segments.push({ x1: x, x2: x + len });
    coins.push({
      x: x + len * 0.35,
      y: GROUND_Y - 78,
      r: 14,
      act,
      collected: false,
      bob: Math.random() * 10,
      timeLabel: `${minutesToLabel(start)}–${minutesToLabel(end)}`,
      ...extra,
    });
    x += len;
  }

  for (const block of sorted) {
    if (block.start > cursor) pushCoin(cursor, block.start, BLACKBOX);
    const base = block.categoryKey ? findActivityByKey(block.categoryKey) : null;
    const act = base ? { ...base, label: block.title || base.label } : BLACKBOX;
    pushCoin(block.start, block.end, act, { log: block.log || "", tags: block.tags || [] });
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < 1440) pushCoin(cursor, 1440, BLACKBOX);

  const { flagX, levelWidth } = finishLevel(segments, x);
  return { segments, coins, flagX, levelWidth };
}

export function buildSummary(items) {
  const known = items.filter((a) => a.key);
  if (known.length === 0)
    return "Today's mostly a black box — that's alright, tomorrow's a new page.";
  const labels = known.map((a) => a.label.toLowerCase());
  let phrase;
  if (labels.length === 1) phrase = labels[0];
  else if (labels.length === 2) phrase = `${labels[0]} and ${labels[1]}`;
  else phrase = `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  const hadUnknown = items.some((a) => !a.key);
  return (
    `You ran through a day of ${phrase}.` +
    (hadUnknown ? " A few hours stayed a mystery — and that's okay." : "")
  );
}
