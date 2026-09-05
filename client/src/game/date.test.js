import { describe, it, expect } from "vitest";
import { todayDateString } from "./date.js";

describe("todayDateString", () => {
  it("formats as YYYY-MM-DD with zero-padded month/day", () => {
    expect(todayDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayDateString(new Date(2026, 8, 30))).toBe("2026-09-30");
  });
});
