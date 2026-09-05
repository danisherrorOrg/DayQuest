import { describe, it, expect } from "vitest";
import {
  buildDayPages,
  buildDaySegments,
  buildDaySummary,
  buildSummaryText,
  pageBody,
  pageNameplate,
} from "./dayRecap.js";

describe("buildDayPages — cards mode", () => {
  it("makes one activity page per card plus a trailing filler for unaccounted time", () => {
    const cards = [
      { title: "Leg day", categoryKey: "gym", durationMins: 30, log: "", tags: [] },
      { title: "Lunch", categoryKey: "food", durationMins: 30, log: "", tags: [] },
    ];
    const pages = buildDayPages("cards", { cards });

    expect(pages).toHaveLength(3);
    expect(pages[0]).toMatchObject({ kind: "activity", title: "Leg day", timeLabel: "30m" });
    expect(pages[0].category.key).toBe("gym");
    expect(pages[1]).toMatchObject({ kind: "activity", title: "Lunch" });
    expect(pages[2]).toMatchObject({ kind: "filler", timeLabel: "23h", durationMins: 1380 });
  });

  it("carries the card's log and tags onto the page", () => {
    const cards = [
      {
        title: "Deep work",
        categoryKey: "work",
        durationMins: 1440,
        log: "Shipped the feature",
        tags: ["focus", "sprint"],
      },
    ];
    const pages = buildDayPages("cards", { cards });
    expect(pages).toHaveLength(1); // fills the full day, no filler page
    expect(pages[0].log).toBe("Shipped the feature");
    expect(pages[0].tags).toEqual(["focus", "sprint"]);
  });

  it("falls back to the category label when no title is given", () => {
    const cards = [{ title: "", categoryKey: "gym", durationMins: 1440, log: "", tags: [] }];
    const pages = buildDayPages("cards", { cards });
    expect(pages[0].title).toBe("Gym");
  });
});

describe("buildDayPages — builder mode", () => {
  it("fills untouched time around a single block with filler pages", () => {
    const blocks = [{ start: 60, end: 90, categoryKey: "gym", title: "Gym", log: "", tags: [] }];
    const pages = buildDayPages("builder", { blocks });

    expect(pages).toHaveLength(3);
    expect(pages[0].kind).toBe("filler");
    expect(pages[0].timeLabel).toBe("12:00 AM–1:00 AM");
    expect(pages[1]).toMatchObject({ kind: "activity", title: "Gym" });
    expect(pages[1].timeLabel).toBe("1:00 AM–1:30 AM");
    expect(pages[2].kind).toBe("filler");
  });

  it("does not add a filler gap between two back-to-back blocks", () => {
    const blocks = [
      { start: 0, end: 720, categoryKey: "work", title: "Work", log: "", tags: [] },
      { start: 720, end: 1440, categoryKey: "sleep", title: "Sleep", log: "", tags: [] },
    ];
    const pages = buildDayPages("builder", { blocks });
    expect(pages).toHaveLength(2);
    expect(pages.every((p) => p.kind === "activity")).toBe(true);
  });

  it("treats a block with no category as filler, keeping its log/tags", () => {
    const blocks = [
      { start: 0, end: 1440, categoryKey: null, title: "", log: "napped?", tags: ["maybe"] },
    ];
    const pages = buildDayPages("builder", { blocks });
    expect(pages).toHaveLength(1);
    expect(pages[0].kind).toBe("filler");
  });

  it("sorts out-of-order blocks before laying them out", () => {
    const blocks = [
      { start: 700, end: 740, categoryKey: "food", title: "Lunch", log: "", tags: [] },
      { start: 0, end: 30, categoryKey: "gym", title: "Gym", log: "", tags: [] },
    ];
    const pages = buildDayPages("builder", { blocks });
    const activities = pages.filter((p) => p.kind === "activity");
    expect(activities.map((p) => p.category.key)).toEqual(["gym", "food"]);
  });
});

describe("buildDayPages — sequence (moments) mode", () => {
  it("makes one activity page per moment, no filler pages", () => {
    const moments = [
      { text: "went for a run", time: 0 },
      { text: "ate lunch", time: 60 },
    ];
    const pages = buildDayPages("sequence", { moments });
    expect(pages.every((p) => p.kind === "activity")).toBe(true);
    expect(pages[0].category.key).toBe("gym");
  });

  it("falls back to a single filler page when there's nothing logged", () => {
    const pages = buildDayPages("sequence", { moments: [] });
    expect(pages).toHaveLength(1);
    expect(pages[0].kind).toBe("filler");
  });
});

describe("buildDaySummary", () => {
  it("totals tracked minutes and breaks them down by category, largest first", () => {
    const cards = [
      { title: "Gym", categoryKey: "gym", durationMins: 30, log: "", tags: [] },
      { title: "More gym", categoryKey: "gym", durationMins: 30, log: "", tags: [] },
      { title: "Lunch", categoryKey: "food", durationMins: 45, log: "", tags: [] },
    ];
    const pages = buildDayPages("cards", { cards });
    const summary = buildDaySummary(pages);

    expect(summary.totalTrackedMins).toBe(105);
    expect(summary.breakdown[0]).toMatchObject({ mins: 60 });
    expect(summary.breakdown[0].category.key).toBe("gym");
    expect(summary.breakdown[1]).toMatchObject({ mins: 45 });
  });
});

describe("buildSummaryText", () => {
  it("returns the black-box message when nothing was recognized", () => {
    const pages = buildDayPages("builder", { blocks: [] });
    expect(buildSummaryText(pages)).toMatch(/black box/);
  });

  it("joins two known activities with 'and' and notes a mystery gap", () => {
    const blocks = [
      { start: 0, end: 60, categoryKey: "gym", title: "Gym", log: "", tags: [] },
      { start: 60, end: 120, categoryKey: "food", title: "Lunch", log: "", tags: [] },
    ];
    const pages = buildDayPages("builder", { blocks });
    const text = buildSummaryText(pages);
    expect(text).toMatch(/gym and food/);
    expect(text).toMatch(/mystery/);
  });

  it("oxford-commas three or more known activities", () => {
    const cards = [
      { title: "", categoryKey: "gym", durationMins: 480, log: "", tags: [] },
      { title: "", categoryKey: "food", durationMins: 480, log: "", tags: [] },
      { title: "", categoryKey: "work", durationMins: 480, log: "", tags: [] },
    ];
    const pages = buildDayPages("cards", { cards });
    expect(buildSummaryText(pages)).toBe("You spent today on gym, food, and work.");
  });
});

describe("buildDaySegments — cards mode", () => {
  it("lays cards out end-to-end from midnight, skipping black-box time entirely", () => {
    const cards = [
      { title: "Leg day", categoryKey: "gym", durationMins: 30, log: "", tags: [] },
      { title: "Lunch", categoryKey: "food", durationMins: 45, log: "", tags: [] },
    ];
    const segments = buildDaySegments("cards", { cards });
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ start: 0, end: 30, title: "Leg day" });
    expect(segments[1]).toMatchObject({ start: 30, end: 75, title: "Lunch" });
    expect(segments.every((s) => !s.isPoint)).toBe(true);
  });
});

describe("buildDaySegments — builder mode", () => {
  it("only includes categorized blocks, using their absolute start/end", () => {
    const blocks = [
      { start: 480, end: 540, categoryKey: "gym", title: "Gym", log: "", tags: [] },
      { start: 0, end: 480, categoryKey: null, title: "", log: "", tags: [] },
    ];
    const segments = buildDaySegments("builder", { blocks });
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ start: 480, end: 540, title: "Gym" });
  });

  it("sorts out-of-order blocks by start time", () => {
    const blocks = [
      { start: 700, end: 740, categoryKey: "food", title: "Lunch", log: "", tags: [] },
      { start: 0, end: 30, categoryKey: "gym", title: "Gym", log: "", tags: [] },
    ];
    const segments = buildDaySegments("builder", { blocks });
    expect(segments.map((s) => s.category.key)).toEqual(["gym", "food"]);
  });
});

describe("buildDaySegments — sequence (moments) mode", () => {
  it("only places moments that have a recorded time, as zero-width points", () => {
    const moments = [
      { text: "went for a run", time: 0 },
      { text: "no time on this one", time: null },
    ];
    const segments = buildDaySegments("sequence", { moments });
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ start: 0, end: 0, isPoint: true });
  });
});

describe("pageNameplate / pageBody", () => {
  it("formats an activity page with time, category and title", () => {
    const blocks = [
      { start: 390, end: 420, categoryKey: "gym", title: "Leg day", log: "", tags: [] },
    ];
    const activity = buildDayPages("builder", { blocks }).find((p) => p.kind === "activity");
    expect(pageNameplate(activity)).toBe("6:30 AM–7:00 AM · 🏋️ GYM");
    expect(pageBody(activity)).toBe("Leg day");
  });

  it("includes the log text on its own line when present", () => {
    const cards = [
      { title: "Leg day", categoryKey: "gym", durationMins: 30, log: "Felt strong", tags: [] },
    ];
    const [activity] = buildDayPages("cards", { cards });
    expect(pageBody(activity)).toBe("Leg day\nFelt strong");
  });

  it("formats a filler page as a black-box mystery", () => {
    const [filler] = buildDayPages("cards", { cards: [] });
    expect(pageNameplate(filler)).toMatch(/BLACK BOX/);
    expect(pageBody(filler)).toBe("...the rest is a mystery.");
  });
});
