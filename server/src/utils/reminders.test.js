import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { find: vi.fn() },
}));
vi.mock("../models/Day.js", () => ({
  default: { find: vi.fn() },
}));
vi.mock("./mailer.js", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

import User from "../models/User.js";
import Day from "../models/Day.js";
import { sendMail } from "./mailer.js";
import { sendDailyReminders } from "./reminders.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendDailyReminders", () => {
  it("does nothing when there are no reminder-eligible users", async () => {
    User.find.mockResolvedValue([]);
    const result = await sendDailyReminders(new Date("2026-09-05T12:00:00Z"));
    expect(result).toEqual({ sent: 0 });
    expect(Day.find).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("only queries verified users who haven't opted out", async () => {
    User.find.mockResolvedValue([]);
    await sendDailyReminders(new Date("2026-09-05T12:00:00Z"));
    expect(User.find).toHaveBeenCalledWith(
      { emailVerified: true, remindersEnabled: { $ne: false } },
      "_id email",
    );
  });

  it("emails only users who haven't logged today (UTC) yet", async () => {
    User.find.mockResolvedValue([
      { _id: "u1", email: "a@x.com" },
      { _id: "u2", email: "b@x.com" },
    ]);
    Day.find.mockReturnValue({ distinct: vi.fn().mockResolvedValue(["u1"]) });

    const result = await sendDailyReminders(new Date("2026-09-05T21:00:00Z"));

    expect(Day.find).toHaveBeenCalledWith({ date: "2026-09-05" });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "b@x.com" }));
    expect(result).toEqual({ sent: 1 });
  });

  it("does not let a failed send reject the overall job", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    User.find.mockResolvedValue([{ _id: "u1", email: "a@x.com" }]);
    Day.find.mockReturnValue({ distinct: vi.fn().mockResolvedValue([]) });
    sendMail.mockRejectedValueOnce(new Error("smtp down"));

    await expect(sendDailyReminders(new Date("2026-09-05T12:00:00Z"))).resolves.toEqual({
      sent: 1,
    });
    await vi.waitFor(() => expect(errorSpy).toHaveBeenCalled());
    errorSpy.mockRestore();
  });
});
