import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/Day.js", () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

import Day from "../models/Day.js";
import { saveDay, listDays, getDay, deleteDay } from "./days.controller.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveDay", () => {
  it("rejects a date that isn't YYYY-MM-DD", async () => {
    const res = mockRes();
    await saveDay(
      { params: { date: "09-04-2026" }, body: { mode: "timed" }, userId: "u1" },
      res,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Day.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects a mode outside the allowed enum", async () => {
    const res = mockRes();
    await saveDay(
      { params: { date: "2026-09-04" }, body: { mode: "nonsense" }, userId: "u1" },
      res,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Day.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("upserts the day scoped to the current user and returns it", async () => {
    const saved = { _id: "d1", date: "2026-09-04", mode: "timed" };
    Day.findOneAndUpdate.mockResolvedValue(saved);
    const res = mockRes();

    await saveDay(
      {
        params: { date: "2026-09-04" },
        body: { mode: "timed", timeline: [{ start: 0, end: 30 }], summary: "ran a lap" },
        userId: "u1",
      },
      res,
      vi.fn(),
    );

    expect(Day.findOneAndUpdate).toHaveBeenCalledWith(
      { user: "u1", date: "2026-09-04" },
      expect.objectContaining({
        mode: "timed",
        timeline: [{ start: 0, end: 30 }],
        activities: null,
        moments: null,
        summary: "ran a lap",
      }),
      { new: true, upsert: true, runValidators: true },
    );
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  it("forwards unexpected errors to next() instead of throwing", async () => {
    const err = new Error("db down");
    Day.findOneAndUpdate.mockRejectedValue(err);
    const next = vi.fn();
    await saveDay(
      { params: { date: "2026-09-04" }, body: { mode: "timed" }, userId: "u1" },
      mockRes(),
      next,
    );
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe("listDays", () => {
  it("lists the current user's days, most recent date first", async () => {
    const days = [{ date: "2026-09-04" }, { date: "2026-09-03" }];
    const sort = vi.fn().mockResolvedValue(days);
    Day.find.mockReturnValue({ sort });
    const res = mockRes();

    await listDays({ userId: "u1" }, res, vi.fn());

    expect(Day.find).toHaveBeenCalledWith({ user: "u1" });
    expect(sort).toHaveBeenCalledWith({ date: -1 });
    expect(res.json).toHaveBeenCalledWith(days);
  });
});

describe("getDay", () => {
  it("404s when the user has no saved day for that date", async () => {
    Day.findOne.mockResolvedValue(null);
    const res = mockRes();
    await getDay({ params: { date: "2026-09-04" }, userId: "u1" }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns the saved day scoped to the current user", async () => {
    const day = { date: "2026-09-04", mode: "sequence" };
    Day.findOne.mockResolvedValue(day);
    const res = mockRes();
    await getDay({ params: { date: "2026-09-04" }, userId: "u1" }, res, vi.fn());
    expect(Day.findOne).toHaveBeenCalledWith({ user: "u1", date: "2026-09-04" });
    expect(res.json).toHaveBeenCalledWith(day);
  });
});

describe("deleteDay", () => {
  it("404s when the user has no saved day for that date", async () => {
    Day.findOneAndDelete.mockResolvedValue(null);
    const res = mockRes();
    await deleteDay({ params: { date: "2026-09-04" }, userId: "u1" }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deletes the saved day scoped to the current user", async () => {
    Day.findOneAndDelete.mockResolvedValue({ date: "2026-09-04" });
    const res = mockRes();
    await deleteDay({ params: { date: "2026-09-04" }, userId: "u1" }, res, vi.fn());
    expect(Day.findOneAndDelete).toHaveBeenCalledWith({ user: "u1", date: "2026-09-04" });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("forwards unexpected errors to next() instead of throwing", async () => {
    const err = new Error("db down");
    Day.findOneAndDelete.mockRejectedValue(err);
    const next = vi.fn();
    await deleteDay({ params: { date: "2026-09-04" }, userId: "u1" }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
