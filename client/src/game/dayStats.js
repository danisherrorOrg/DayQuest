import { buildDayPages, buildDaySummary } from "./dayRecap.js";
import { todayDateString } from "./date.js";

// Merges each day's per-category breakdown (already computed by
// buildDaySummary) into one running total across every day passed in.
export function aggregateDays(days) {
  const byCategory = new Map();
  let totalTrackedMins = 0;

  for (const day of days) {
    const pages = buildDayPages(day.mode, { cards: day.logCards, blocks: day.timelineBlocks });
    const { totalTrackedMins: dayMins, breakdown } = buildDaySummary(pages);
    totalTrackedMins += dayMins;
    for (const { category, mins } of breakdown) {
      const entry = byCategory.get(category.key) || { category, mins: 0 };
      entry.mins += mins;
      byCategory.set(category.key, entry);
    }
  }

  return {
    totalDays: days.length,
    totalTrackedMins,
    breakdown: [...byCategory.values()].sort((a, b) => b.mins - a.mins),
  };
}

// Keeps only days from the last `n` days (inclusive of today), comparing
// YYYY-MM-DD strings directly — they sort lexicographically the same as
// chronologically, the same trick the server's listDays sort relies on.
export function withinLastNDays(days, n, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (n - 1));
  const cutoffStr = todayDateString(cutoff);
  return days.filter((day) => day.date >= cutoffStr);
}
