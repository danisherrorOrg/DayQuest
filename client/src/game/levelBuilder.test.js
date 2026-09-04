import { describe, it, expect, afterEach, vi } from "vitest";
import {
  SLOT_COUNT,
  pxForDuration,
  timelineFromSlots,
  buildLevelFromTimeline,
  buildLevelFromMoments,
  buildLevelFromLogCards,
  buildSummary,
} from "./levelBuilder.js";
import { BLACKBOX, findActivityByKey } from "./activities.js";

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

describe("timelineFromSlots", () => {
  it("fills every unfilled slot with the black-box activity as one segment", () => {
    const slots = new Array(SLOT_COUNT).fill(null);
    const segs = timelineFromSlots(slots);
    expect(segs).toEqual([{ start: 0, end: 1440, act: BLACKBOX }]);
  });

  it("merges consecutive slots for the same activity into one segment", () => {
    const gym = findActivityByKey("gym");
    const slots = new Array(SLOT_COUNT).fill(null);
    slots[0] = gym;
    slots[1] = gym;
    const segs = timelineFromSlots(slots);
    expect(segs[0]).toEqual({ start: 0, end: 60, act: gym });
  });

  it("starts a new segment when the activity changes", () => {
    const gym = findActivityByKey("gym");
    const food = findActivityByKey("food");
    const slots = new Array(SLOT_COUNT).fill(null);
    slots[0] = gym;
    slots[1] = food;
    const segs = timelineFromSlots(slots);
    expect(segs[0]).toEqual({ start: 0, end: 30, act: gym });
    expect(segs[1].start).toBe(30);
    expect(segs[1].act).toBe(food);
  });
});

describe("buildLevelFromTimeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lays out one segment/coin per timeline entry plus a finish segment", () => {
    const gym = findActivityByKey("gym");
    const timeline = [{ start: 0, end: 30, act: gym }];
    const { segments, coins, flagX, levelWidth } = buildLevelFromTimeline(timeline);

    expect(segments).toHaveLength(2); // activity segment + finish segment
    expect(coins).toHaveLength(1);
    expect(coins[0].act).toBe(gym);
    expect(coins[0].timeLabel).toBe("12:00 AM–12:30 AM");

    const [activitySeg, finishSeg] = segments;
    expect(activitySeg.x1).toBe(40);
    expect(activitySeg.x2).toBe(40 + pxForDuration(30));
    expect(finishSeg.x1).toBe(activitySeg.x2); // no gap before the finish segment
    expect(flagX).toBe(finishSeg.x2 - 40);
    expect(levelWidth).toBe(finishSeg.x2 + 60);
  });

  it("adds a random physical gap between successive segments", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const gym = findActivityByKey("gym");
    const timeline = [
      { start: 0, end: 30, act: gym },
      { start: 30, end: 60, act: gym },
    ];
    const { segments } = buildLevelFromTimeline(timeline);
    const gap = segments[1].x1 - segments[0].x2;
    expect(gap).toBe(70 + 0.5 * 35);
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
      { title: "Deep work", categoryKey: "work", durationMins: 1440, log: "Shipped the feature", tags: ["focus", "sprint"] },
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
