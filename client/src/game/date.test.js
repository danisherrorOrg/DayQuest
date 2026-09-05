import { describe, it, expect } from "vitest";
import { todayDateString, formatDisplayDate } from "./date.js";

describe("todayDateString", () => {
  it("formats as YYYY-MM-DD with zero-padded month/day", () => {
    expect(todayDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayDateString(new Date(2026, 8, 30))).toBe("2026-09-30");
  });
});

describe("formatDisplayDate", () => {
  it("formats a YYYY-MM-DD string as a short display date", () => {
    expect(formatDisplayDate("2026-09-05")).toBe("Sep 5, 2026");
    expect(formatDisplayDate("2026-01-01")).toBe("Jan 1, 2026");
  });
});
