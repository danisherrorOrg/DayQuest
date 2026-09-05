import { describe, it, expect } from "vitest";
import { aggregateDays, withinLastNDays } from "./dayStats.js";

describe("aggregateDays", () => {
  it("returns zeroed totals for no days", () => {
    expect(aggregateDays([])).toEqual({ totalDays: 0, totalTrackedMins: 0, breakdown: [] });
  });

  it("sums minutes for the same category across cards- and builder-mode days", () => {
    const days = [
      {
        date: "2026-09-01",
        mode: "cards",
        logCards: [{ title: "Gym", categoryKey: "gym", durationMins: 60, log: "", tags: [] }],
      },
      {
        date: "2026-09-02",
        mode: "builder",
        timelineBlocks: [
          { start: 0, end: 120, categoryKey: "gym", title: "Gym", log: "", tags: [] },
        ],
      },
    ];
    const stats = aggregateDays(days);
    expect(stats.totalDays).toBe(2);
    expect(stats.totalTrackedMins).toBe(180);
    expect(stats.breakdown).toHaveLength(1);
    expect(stats.breakdown[0]).toMatchObject({ mins: 180 });
    expect(stats.breakdown[0].category.key).toBe("gym");
  });

  it("sorts categories by total minutes, largest first", () => {
    const days = [
      {
        date: "2026-09-01",
        mode: "cards",
        logCards: [
          { title: "Lunch", categoryKey: "food", durationMins: 30, log: "", tags: [] },
          { title: "Gym", categoryKey: "gym", durationMins: 90, log: "", tags: [] },
        ],
      },
    ];
    const stats = aggregateDays(days);
    expect(stats.breakdown.map((b) => b.category.key)).toEqual(["gym", "food"]);
  });

  it("still counts a day toward totalDays even if it has nothing to break down", () => {
    const days = [{ date: "2026-09-01", mode: "sequence" }];
    const stats = aggregateDays(days);
    expect(stats.totalDays).toBe(1);
    expect(stats.totalTrackedMins).toBe(0);
    expect(stats.breakdown).toEqual([]);
  });
});

describe("withinLastNDays", () => {
  it("keeps only days on or after the cutoff, inclusive of today", () => {
    const days = [{ date: "2026-08-30" }, { date: "2026-09-03" }, { date: "2026-09-05" }];
    const now = new Date(2026, 8, 5); // Sep 5, 2026
    const kept = withinLastNDays(days, 3, now); // cutoff: Sep 3
    expect(kept.map((d) => d.date)).toEqual(["2026-09-03", "2026-09-05"]);
  });
});
