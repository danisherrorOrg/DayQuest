import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Day from "../models/Day.js";
import { sendMail } from "../utils/mailer.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const CLIENT_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: "HS256",
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}

// Issues a fresh access token and rotates the refresh token (stored hashed, never in plaintext).
async function issueSession(user, res) {
  const refreshToken = crypto.randomBytes(40).toString("hex");
  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await user.save();
  setRefreshCookie(res, refreshToken);
  return signAccessToken(user);
}

function sessionResponse(user, token) {
  return {
    token,
    email: user.email,
    emailVerified: user.emailVerified,
    remindersEnabled: user.remindersEnabled,
  };
}

async function sendVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.verificationTokenHash = hashToken(token);
  user.verificationTokenExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await user.save();

  const link = `${CLIENT_ORIGIN}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Verify your Day Story email",
    text: `Welcome to Day Story! Verify your email by visiting:\n\n${link}\n\nThis link expires in 24 hours.`,
  });
}

async function sendPasswordResetEmail(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const link = `${CLIENT_ORIGIN}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your Day Story password",
    text: `Reset your password by visiting:\n\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  });
}

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Invalid email format" });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(409).json({ error: "An account with that email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizedEmail, passwordHash });

    const token = await issueSession(user, res);
    sendVerificationEmail(user).catch((err) =>
      console.error("Failed to send verification email", err),
    );
    res.status(201).json(sessionResponse(user, token));
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = await issueSession(user, res);
    res.json(sessionResponse(user, token));
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    const user = await User.findOne({ refreshTokenHash: hashToken(token) }).select(
      "+refreshTokenHash +refreshTokenExpiresAt",
    );

    if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now()) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const newAccessToken = await issueSession(user, res);
    res.json(sessionResponse(user, newAccessToken));
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await User.updateOne(
        { refreshTokenHash: hashToken(token) },
        { $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 } },
      );
    }
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });
    res.json({
      email: user.email,
      emailVerified: user.emailVerified,
      remindersEnabled: user.remindersEnabled,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const user = await User.findOne({ verificationTokenHash: hashToken(token) }).select(
      "+verificationTokenHash +verificationTokenExpiresAt",
    );
    if (
      !user ||
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({ error: "Invalid or expired verification link" });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { emailVerified: true },
        $unset: { verificationTokenHash: 1, verificationTokenExpiresAt: 1 },
      },
    );

    res.json({ message: "Email verified. You can now log in." });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && !user.emailVerified) {
      sendVerificationEmail(user).catch((err) =>
        console.error("Failed to send verification email", err),
      );
    }

    // Same response whether or not the account exists/is already verified, to avoid leaking
    // which emails are registered.
    res.json({
      message: "If that account exists and isn't verified yet, a verification email has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      sendPasswordResetEmail(user).catch((err) =>
        console.error("Failed to send password reset email", err),
      );
    }

    // Same response whether or not the account exists, to avoid leaking which emails are
    // registered.
    res.json({ message: "If that account exists, a password reset email has been sent." });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: "Token and password are required" });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await User.findOne({ resetTokenHash: hashToken(token) }).select(
      "+resetTokenHash +resetTokenExpiresAt",
    );
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash },
        // A password reset invalidates any existing session — force re-login everywhere.
        $unset: {
          resetTokenHash: 1,
          resetTokenExpiresAt: 1,
          refreshTokenHash: 1,
          refreshTokenExpiresAt: 1,
        },
      },
    );

    clearRefreshCookie(res);
    res.json({ message: "Password has been reset. Please log in." });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Current and new password are required" });
    if (newPassword.length < 8)
      return res.status(400).json({ error: "New password must be at least 8 characters" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Current password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // The schema only tracks one refresh token per user, so issuing a new
    // one here (like a fresh login would) already replaces whatever
    // session existed — no separate revoke step needed.
    const token = await issueSession(user, res);
    res.json(sessionResponse(user, token));
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    await Day.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    clearRefreshCookie(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function updateReminderPreference(req, res, next) {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean")
      return res.status(400).json({ error: "enabled must be a boolean" });

    await User.updateOne({ _id: req.userId }, { $set: { remindersEnabled: enabled } });
    res.json({ remindersEnabled: enabled });
  } catch (err) {
    next(err);
  }
}
