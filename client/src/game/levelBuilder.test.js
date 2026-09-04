import { describe, it, expect } from "vitest";
import {
  pxForDuration,
  buildLevelFromMoments,
  buildLevelFromLogCards,
  buildLevelFromBuilderBlocks,
  buildSummary,
} from "./levelBuilder.js";
import { BLACKBOX } from "./activities.js";

describe("pxForDuration", () => {
  it("clamps very short durations to a minimum width", () => {
    expect(pxForDuration(1)).toBe(140);
  });

  it("clamps very long durations to a maximum width", () => {
    expect(pxForDuration(1000)).toBe(460);
  });

  it("scales linearly between the clamps", () => {
    expect(pxForDuration(60)).toBe(204); // 60 * 3.4
  });
});

describe("buildLevelFromMoments", () => {
  it("uses the gap between consecutive timed moments as the segment length", () => {
    const moments = [
      { text: "gym", time: 0 },
      { text: "lunch", time: 60 },
    ];
    const { segments } = buildLevelFromMoments(moments);
    expect(segments[0].x2 - segments[0].x1).toBe(pxForDuration(60));
  });

  it("falls back to a default length when there's no next timed moment", () => {
    const { segments } = buildLevelFromMoments([{ text: "gym", time: 0 }]);
    expect(segments[0].x2 - segments[0].x1).toBe(280);
  });

  it("falls back to a default length when the next moment isn't later in time", () => {
    const moments = [
      { text: "gym", time: 60 },
      { text: "lunch", time: 30 }, // earlier, not a valid duration
    ];
    const { segments } = buildLevelFromMoments(moments);
    expect(segments[0].x2 - segments[0].x1).toBe(280);
  });

  it("guesses an activity from free text when the moment has no tagged activity", () => {
    const { coins } = buildLevelFromMoments([{ text: "went for a run", time: null }]);
    expect(coins[0].act.key).toBe("gym");
    expect(coins[0].timeLabel).toBeNull();
  });
});

describe("buildLevelFromLogCards", () => {
  it("lays out one segment/coin per card using its own duration, plus a finish segment", () => {
    const cards = [
      { title: "Leg day", categoryKey: "gym", durationMins: 30, log: "", tags: [] },
      { title: "Lunch", categoryKey: "food", durationMins: 30, log: "", tags: [] },
    ];
    const { segments, coins } = buildLevelFromLogCards(cards);

    // 2 activity segments + 1 trailing black-box segment (23h left) + 1 finish segment
    expect(segments).toHaveLength(4);
    expect(coins).toHaveLength(3);
    expect(coins[0].act.key).toBe("gym");
    expect(coins[0].act.label).toBe("Leg day");
    expect(coins[0].timeLabel).toBe("30m");
    expect(coins[1].act.label).toBe("Lunch");
    expect(coins[2].act).toBe(BLACKBOX);
    expect(coins[2].timeLabel).toBe("23h");
  });

  it("carries the card's log and tags onto the coin", () => {
    const cards = [
      {
        title: "Deep work",
        categoryKey: "work",
        durationMins: 1440,
        log: "Shipped the feature",
        tags: ["focus", "sprint"],
      },
    ];
    const { coins } = buildLevelFromLogCards(cards);
    expect(coins).toHaveLength(1); // fills the full day, no black-box segment
    expect(coins[0].log).toBe("Shipped the feature");
    expect(coins[0].tags).toEqual(["focus", "sprint"]);
  });

  it("falls back to the category label when no title is given", () => {
    const cards = [{ title: "", categoryKey: "gym", durationMins: 1440, log: "", tags: [] }];
    const { coins } = buildLevelFromLogCards(cards);
    expect(coins[0].act.label).toBe("Gym");
  });
});

describe("buildLevelFromBuilderBlocks", () => {
  it("fills untouched time around a single block with black box", () => {
    const blocks = [{ start: 60, end: 90, categoryKey: "gym", title: "Gym", log: "", tags: [] }];
    const { coins } = buildLevelFromBuilderBlocks(blocks);

    // black box before, the block itself, black box after
    expect(coins).toHaveLength(3);
    expect(coins[0].act).toBe(BLACKBOX);
    expect(coins[0].timeLabel).toBe("12:00 AM–1:00 AM");
    expect(coins[1].act.key).toBe("gym");
    expect(coins[1].act.label).toBe("Gym");
    expect(coins[1].timeLabel).toBe("1:00 AM–1:30 AM");
    expect(coins[2].act).toBe(BLACKBOX);
  });

  it("does not add a black-box gap between two back-to-back blocks", () => {
    const blocks = [
      { start: 0, end: 720, categoryKey: "work", title: "Work", log: "", tags: [] },
      { start: 720, end: 1440, categoryKey: "sleep", title: "Sleep", log: "", tags: [] },
    ];
    const { coins } = buildLevelFromBuilderBlocks(blocks);
    expect(coins).toHaveLength(2);
    expect(coins[0].act.key).toBe("work");
    expect(coins[1].act.key).toBe("sleep");
  });

  it("treats a block with no category as a black box, keeping its title/log/tags", () => {
    const blocks = [
      { start: 0, end: 1440, categoryKey: null, title: "", log: "napped?", tags: ["maybe"] },
    ];
    const { coins } = buildLevelFromBuilderBlocks(blocks);
    expect(coins).toHaveLength(1);
    expect(coins[0].act).toBe(BLACKBOX);
    expect(coins[0].log).toBe("napped?");
    expect(coins[0].tags).toEqual(["maybe"]);
  });

  it("sorts out-of-order blocks before laying them out", () => {
    const blocks = [
      { start: 700, end: 740, categoryKey: "food", title: "Lunch", log: "", tags: [] },
      { start: 0, end: 30, categoryKey: "gym", title: "Gym", log: "", tags: [] },
    ];
    const { coins } = buildLevelFromBuilderBlocks(blocks);
    const labeled = coins.filter((c) => c.act.key);
    expect(labeled.map((c) => c.act.key)).toEqual(["gym", "food"]);
  });
});

describe("buildSummary", () => {
  it("returns the black-box message when nothing was recognized", () => {
    expect(buildSummary([{ key: null, label: "Unknown" }])).toMatch(/black box/);
  });

  it("joins two known activities with 'and'", () => {
    const summary = buildSummary([
      { key: "gym", label: "Gym" },
      { key: "food", label: "Food" },
    ]);
    expect(summary).toBe("You ran through a day of gym and food.");
  });

  it("oxford-commas three or more known activities", () => {
    const summary = buildSummary([
      { key: "gym", label: "Gym" },
      { key: "food", label: "Food" },
      { key: "work", label: "Work" },
    ]);
    expect(summary).toBe("You ran through a day of gym, food, and work.");
  });

  it("notes when some time stayed unknown alongside known activities", () => {
    const summary = buildSummary([
      { key: "gym", label: "Gym" },
      { key: null, label: "Unknown" },
    ]);
    expect(summary).toMatch(/mystery/);
  });
});
