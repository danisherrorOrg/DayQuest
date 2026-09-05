import { BLACKBOX, findActivityByKey, formatDuration, minutesToLabel } from "./activities.js";

const MINUTES_PER_DAY = 1440;

function activityPage({ category, title, timeLabel, log, tags, durationMins }) {
  return { kind: "activity", category, title, timeLabel, log, tags, durationMins };
}

function fillerPage({ timeLabel, durationMins }) {
  return { kind: "filler", timeLabel, durationMins };
}

// A log card only carries a duration (no absolute clock time), so cards lay
// out end-to-end in entry order; any time left under 24h becomes one
// trailing filler page, same "honest black box" framing as the other modes.
function pagesFromLogCards(cards) {
  const pages = [];
  let totalMins = 0;
  for (const card of cards) {
    const category = findActivityByKey(card.categoryKey) || BLACKBOX;
    pages.push(
      activityPage({
        category,
        title: card.title || category.label,
        timeLabel: formatDuration(card.durationMins),
        log: card.log || "",
        tags: card.tags || [],
        durationMins: card.durationMins,
      }),
    );
    totalMins += card.durationMins;
  }
  const remaining = MINUTES_PER_DAY - totalMins;
  if (remaining > 0) {
    pages.push(fillerPage({ timeLabel: formatDuration(remaining), durationMins: remaining }));
  }
  return pages;
}

// Timeline-builder blocks carry explicit start/end minutes but don't have to
// cover the whole day — gaps before/between/after them become filler pages.
function pagesFromBuilderBlocks(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const pages = [];
  let cursor = 0;

  for (const block of sorted) {
    if (block.start > cursor) {
      pages.push(
        fillerPage({
          timeLabel: `${minutesToLabel(cursor)}–${minutesToLabel(block.start)}`,
          durationMins: block.start - cursor,
        }),
      );
    }
    const timeLabel = `${minutesToLabel(block.start)}–${minutesToLabel(block.end)}`;
    const durationMins = block.end - block.start;
    const category = block.categoryKey ? findActivityByKey(block.categoryKey) : null;
    if (category) {
      pages.push(
        activityPage({
          category,
          title: block.title || category.label,
          timeLabel,
          log: block.log || "",
          tags: block.tags || [],
          durationMins,
        }),
      );
    } else {
      pages.push(fillerPage({ timeLabel, durationMins }));
    }
    cursor = Math.max(cursor, block.end);
  }

  if (cursor < MINUTES_PER_DAY) {
    pages.push(
      fillerPage({
        timeLabel: `${minutesToLabel(cursor)}–${minutesToLabel(MINUTES_PER_DAY)}`,
        durationMins: MINUTES_PER_DAY - cursor,
      }),
    );
  }
  return pages;
}

// A day saved under a mode with no entry screen anymore ("sequence" from
// the retired moments-list mode, or the older "timed"/"legacy" values) has
// no page-building logic left — it just renders as a fully black-box day.
export function buildDayPages(mode, { cards, blocks }) {
  let pages;
  if (mode === "cards") pages = pagesFromLogCards(cards || []);
  else if (mode === "builder") pages = pagesFromBuilderBlocks(blocks || []);
  else pages = [];

  if (pages.length === 0) {
    pages = [fillerPage({ timeLabel: null, durationMins: null })];
  }
  return pages;
}

// Absolute-time segments for the chrono-bar review mode — unlike
// buildDayPages, only real (categorized) activities are included; black-box
// gaps just stay uncovered stretches of the bar rather than their own
// entries, per the "shown honestly, not hidden" framing.
function segmentsFromLogCards(cards) {
  const segments = [];
  let cursor = 0;
  for (const card of cards) {
    const category = findActivityByKey(card.categoryKey) || BLACKBOX;
    const start = cursor;
    const end = Math.min(MINUTES_PER_DAY, cursor + card.durationMins);
    segments.push({
      id: `card-${segments.length}`,
      start,
      end,
      category,
      title: card.title || category.label,
      log: card.log || "",
      tags: card.tags || [],
      timeLabel: `${minutesToLabel(start)}–${minutesToLabel(end)}`,
      isPoint: false,
    });
    cursor = end;
  }
  return segments;
}

function segmentsFromBuilderBlocks(blocks) {
  return [...blocks]
    .filter((b) => b.categoryKey)
    .sort((a, b) => a.start - b.start)
    .map((b, i) => {
      const category = findActivityByKey(b.categoryKey) || BLACKBOX;
      return {
        id: `block-${i}`,
        start: b.start,
        end: b.end,
        category,
        title: b.title || category.label,
        log: b.log || "",
        tags: b.tags || [],
        timeLabel: `${minutesToLabel(b.start)}–${minutesToLabel(b.end)}`,
        isPoint: false,
      };
    });
}

export function buildDaySegments(mode, { cards, blocks }) {
  if (mode === "cards") return segmentsFromLogCards(cards || []);
  if (mode === "builder") return segmentsFromBuilderBlocks(blocks || []);
  return [];
}

export function buildDaySummary(pages) {
  const activityPages = pages.filter((p) => p.kind === "activity");
  const totalTrackedMins = activityPages.reduce((sum, p) => sum + (p.durationMins || 0), 0);

  const byCategory = new Map();
  for (const p of activityPages) {
    const entry = byCategory.get(p.category.key) || { category: p.category, mins: 0 };
    entry.mins += p.durationMins || 0;
    byCategory.set(p.category.key, entry);
  }
  const breakdown = [...byCategory.values()].sort((a, b) => b.mins - a.mins);

  return { totalTrackedMins, breakdown };
}

export function buildSummaryText(pages) {
  const known = pages.filter((p) => p.kind === "activity");
  if (known.length === 0) {
    return "Today's mostly a black box — that's alright, tomorrow's a new page.";
  }
  const labels = known.map((p) => p.category.label.toLowerCase());
  let phrase;
  if (labels.length === 1) phrase = labels[0];
  else if (labels.length === 2) phrase = `${labels[0]} and ${labels[1]}`;
  else phrase = `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  const hadGap = pages.some((p) => p.kind === "filler");
  return (
    `You spent today on ${phrase}.` +
    (hadGap ? " A few hours stayed a mystery — and that's okay." : "")
  );
}

export function pageNameplate(page) {
  const prefix = page.timeLabel ? `${page.timeLabel} · ` : "";
  if (page.kind === "filler") return `${prefix}❔ BLACK BOX`;
  return `${prefix}${page.category.emoji} ${page.category.label.toUpperCase()}`;
}

export function pageBody(page) {
  if (page.kind === "filler") return "...the rest is a mystery.";
  const showTitle = page.title && page.title.toLowerCase() !== page.category.label.toLowerCase();
  const lines = [showTitle ? page.title : page.category.label];
  if (page.log) lines.push(page.log);
  return lines.join("\n");
}
