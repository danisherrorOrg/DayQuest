import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

vi.mock("../models/User.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    findById: vi.fn(),
    deleteOne: vi.fn(),
  },
}));
vi.mock("../models/Day.js", () => ({
  default: {
    deleteMany: vi.fn(),
  },
}));
vi.mock("../utils/mailer.js", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

import User from "../models/User.js";
import Day from "../models/Day.js";
import { sendMail } from "../utils/mailer.js";
import {
  register,
  login,
  refresh,
  logout,
  me,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
} from "./auth.controller.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  res.clearCookie = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res;
}

// Mimics a Mongoose query: `User.findOne(...).select(...)`.
function selectableQuery(result) {
  return { select: vi.fn().mockResolvedValue(result) };
}

function fakeUser(overrides = {}) {
  return {
    _id: { toString: () => "user123" },
    email: "person@example.com",
    passwordHash: "",
    emailVerified: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register", () => {
  it("rejects a missing email or password", async () => {
    const res = mockRes();
    await register({ body: { email: "", password: "" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects an invalid email format", async () => {
    const res = mockRes();
    await register({ body: { email: "not-an-email", password: "longenough" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid email format" });
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = mockRes();
    await register({ body: { email: "a@b.com", password: "short1" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a duplicate email", async () => {
    User.findOne.mockResolvedValue(fakeUser());
    const res = mockRes();
    await register({ body: { email: "a@b.com", password: "longenough" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("creates a normalized-email user, issues a session, and emails verification", async () => {
    User.findOne.mockResolvedValue(null);
    const created = fakeUser({ email: "a@b.com" });
    User.create.mockResolvedValue(created);

    const res = mockRes();
    // EMAIL_RE validation runs on the raw value, so only case (not whitespace) can vary here.
    await register({ body: { email: "A@B.com", password: "longenough" } }, res, vi.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com" }), // lowercased
    );
    expect(created.save).toHaveBeenCalled(); // issueSession persisted the refresh token hash
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", emailVerified: false }),
    );
    await vi.waitFor(() => expect(sendMail).toHaveBeenCalled());
  });
});

describe("login", () => {
  it("rejects a missing email or password", async () => {
    const res = mockRes();
    await login({ body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects when no account matches the email", async () => {
    User.findOne.mockResolvedValue(null);
    const res = mockRes();
    await login({ body: { email: "nope@x.com", password: "whatever1" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    User.findOne.mockResolvedValue(fakeUser({ passwordHash }));
    const res = mockRes();
    await login({ body: { email: "a@b.com", password: "wrong-password" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("logs in with the correct password and returns a verifiable token", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    const user = fakeUser({ passwordHash });
    User.findOne.mockResolvedValue(user);
    const res = mockRes();

    await login({ body: { email: "a@b.com", password: "correct-password" } }, res, vi.fn());

    expect(user.save).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    const [payload] = res.json.mock.calls[0];
    expect(payload.email).toBe(user.email);
    const decoded = jwt.verify(payload.token, process.env.JWT_SECRET);
    expect(decoded.sub).toBe("user123");
  });
});

describe("refresh", () => {
  it("rejects when there's no refresh cookie", async () => {
    const res = mockRes();
    await refresh({ cookies: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects and clears the cookie when the token matches no user", async () => {
    User.findOne.mockReturnValue(selectableQuery(null));
    const res = mockRes();
    await refresh({ cookies: { refreshToken: "sometoken" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it("rejects and clears the cookie when the refresh token has expired", async () => {
    const user = fakeUser({ refreshTokenExpiresAt: new Date(Date.now() - 1000) });
    User.findOne.mockReturnValue(selectableQuery(user));
    const res = mockRes();
    await refresh({ cookies: { refreshToken: "sometoken" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it("rotates the session for a valid, unexpired refresh token", async () => {
    const user = fakeUser({ refreshTokenExpiresAt: new Date(Date.now() + 100000) });
    User.findOne.mockReturnValue(selectableQuery(user));
    const res = mockRes();
    await refresh({ cookies: { refreshToken: "sometoken" } }, res, vi.fn());
    expect(user.save).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: user.email }));
  });
});

describe("logout", () => {
  it("revokes the stored refresh token hash and clears the cookie", async () => {
    const res = mockRes();
    await logout({ cookies: { refreshToken: "sometoken" } }, res, vi.fn());
    expect(User.updateOne).toHaveBeenCalledWith(
      { refreshTokenHash: expect.any(String) },
      { $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 } },
    );
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("still clears the cookie when there was no refresh cookie", async () => {
    const res = mockRes();
    await logout({ cookies: {} }, res, vi.fn());
    expect(User.updateOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe("me", () => {
  it("rejects when the user id no longer resolves to a user", async () => {
    User.findById.mockResolvedValue(null);
    const res = mockRes();
    await me({ userId: "gone" }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns the current user's email and verification status", async () => {
    User.findById.mockResolvedValue(fakeUser({ emailVerified: true }));
    const res = mockRes();
    await me({ userId: "user123" }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ email: "person@example.com", emailVerified: true });
  });
});

describe("verifyEmail", () => {
  it("rejects a missing token", async () => {
    const res = mockRes();
    await verifyEmail({ body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects an invalid or expired verification link", async () => {
    User.findOne.mockReturnValue(selectableQuery(null));
    const res = mockRes();
    await verifyEmail({ body: { token: "abc" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.updateOne).not.toHaveBeenCalled();
  });

  it("marks the email verified and clears the verification token", async () => {
    const user = fakeUser({ verificationTokenExpiresAt: new Date(Date.now() + 100000) });
    User.findOne.mockReturnValue(selectableQuery(user));
    const res = mockRes();
    await verifyEmail({ body: { token: "abc" } }, res, vi.fn());
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: user._id },
      {
        $set: { emailVerified: true },
        $unset: { verificationTokenHash: 1, verificationTokenExpiresAt: 1 },
      },
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});

describe("resendVerification / forgotPassword (email-enumeration safe)", () => {
  it("resendVerification responds identically whether or not the account exists", async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res1 = mockRes();
    await resendVerification({ body: { email: "ghost@x.com" } }, res1, vi.fn());

    User.findOne.mockResolvedValueOnce(fakeUser({ emailVerified: true }));
    const res2 = mockRes();
    await resendVerification({ body: { email: "real@x.com" } }, res2, vi.fn());

    expect(res1.json.mock.calls[0]).toEqual(res2.json.mock.calls[0]);
    expect(sendMail).not.toHaveBeenCalled(); // already verified, and ghost doesn't exist
  });

  it("forgotPassword responds identically whether or not the account exists", async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res1 = mockRes();
    await forgotPassword({ body: { email: "ghost@x.com" } }, res1, vi.fn());

    User.findOne.mockResolvedValueOnce(fakeUser());
    const res2 = mockRes();
    await forgotPassword({ body: { email: "real@x.com" } }, res2, vi.fn());

    expect(res1.json.mock.calls[0]).toEqual(res2.json.mock.calls[0]);
    await vi.waitFor(() => expect(sendMail).toHaveBeenCalledTimes(1)); // only for the real account
  });
});

describe("resetPassword", () => {
  it("rejects a missing token/password or a too-short password", async () => {
    const res = mockRes();
    await resetPassword({ body: { token: "", password: "" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects an invalid or expired reset link", async () => {
    User.findOne.mockReturnValue(selectableQuery(null));
    const res = mockRes();
    await resetPassword({ body: { token: "abc", password: "longenough" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("resets the password and revokes the existing session", async () => {
    const user = fakeUser({ resetTokenExpiresAt: new Date(Date.now() + 100000) });
    User.findOne.mockReturnValue(selectableQuery(user));
    const res = mockRes();
    await resetPassword({ body: { token: "abc", password: "longenough" } }, res, vi.fn());

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: user._id },
      expect.objectContaining({
        $set: { passwordHash: expect.any(String) },
        $unset: {
          resetTokenHash: 1,
          resetTokenExpiresAt: 1,
          refreshTokenHash: 1,
          refreshTokenExpiresAt: 1,
        },
      }),
    );
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});

describe("changePassword", () => {
  it("rejects a missing current/new password or a too-short new password", async () => {
    const res = mockRes();
    await changePassword({ userId: "user123", body: { currentPassword: "" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    User.findById.mockResolvedValue(fakeUser({ passwordHash }));
    const res = mockRes();
    await changePassword(
      { userId: "user123", body: { currentPassword: "wrong", newPassword: "longenough2" } },
      res,
      vi.fn(),
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates the password and issues a fresh session", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    const user = fakeUser({ passwordHash });
    User.findById.mockResolvedValue(user);
    const res = mockRes();

    await changePassword(
      {
        userId: "user123",
        body: { currentPassword: "correct-password", newPassword: "longenough2" },
      },
      res,
      vi.fn(),
    );

    expect(user.save).toHaveBeenCalled();
    expect(user.passwordHash).not.toBe(passwordHash);
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: user.email }));
  });
});

describe("deleteAccount", () => {
  it("rejects a missing password", async () => {
    const res = mockRes();
    await deleteAccount({ userId: "user123", body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    User.findById.mockResolvedValue(fakeUser({ passwordHash }));
    const res = mockRes();
    await deleteAccount({ userId: "user123", body: { password: "wrong" } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.deleteOne).not.toHaveBeenCalled();
  });

  it("deletes the user's saved days and account, then clears the session", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    const user = fakeUser({ passwordHash });
    User.findById.mockResolvedValue(user);
    const res = mockRes();

    await deleteAccount(
      { userId: "user123", body: { password: "correct-password" } },
      res,
      vi.fn(),
    );

    expect(Day.deleteMany).toHaveBeenCalledWith({ user: user._id });
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: user._id });
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
