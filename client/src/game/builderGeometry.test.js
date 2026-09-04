import { describe, it, expect } from "vitest";
import { snapMinutes, clamp, neighborBounds, sortByStart } from "./builderGeometry.js";

describe("snapMinutes", () => {
  it("rounds to the nearest snap increment", () => {
    expect(snapMinutes(22, 15)).toBe(15);
    expect(snapMinutes(23, 15)).toBe(30);
    expect(snapMinutes(0, 15)).toBe(0);
  });
});

describe("clamp", () => {
  it("keeps values within range and clamps outside ones", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("neighborBounds", () => {
  it("returns the full day when there are no other blocks", () => {
    expect(neighborBounds([], 300)).toEqual({ lo: 0, hi: 1440 });
  });

  it("bounds the anchor between the nearest block ending before it and starting after it", () => {
    const blocks = [
      { id: "a", start: 60, end: 120 },
      { id: "b", start: 300, end: 360 },
    ];
    expect(neighborBounds(blocks, 200)).toEqual({ lo: 120, hi: 300 });
  });

  it("excludes the given block id from consideration", () => {
    const blocks = [
      { id: "a", start: 60, end: 120 },
      { id: "self", start: 130, end: 200 },
      { id: "b", start: 300, end: 360 },
    ];
    expect(neighborBounds(blocks, 130, "self")).toEqual({ lo: 120, hi: 300 });
  });

  it("only considers blocks whose edge is on the correct side of the anchor", () => {
    // A block starting after the anchor doesn't lower `lo`, even if it ends
    // before other candidates — only blocks fully before/after the anchor count.
    const blocks = [{ id: "a", start: 500, end: 600 }];
    expect(neighborBounds(blocks, 100)).toEqual({ lo: 0, hi: 500 });
  });
});

describe("sortByStart", () => {
  it("sorts without mutating the input array", () => {
    const blocks = [
      { id: "b", start: 300 },
      { id: "a", start: 60 },
    ];
    const sorted = sortByStart(blocks);
    expect(sorted.map((b) => b.id)).toEqual(["a", "b"]);
    expect(blocks.map((b) => b.id)).toEqual(["b", "a"]);
  });
});
