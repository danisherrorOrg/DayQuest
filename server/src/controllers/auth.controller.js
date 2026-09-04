import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    algorithm: "HS256",
  });
}

function hashRefreshToken(token) {
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
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await user.save();
  setRefreshCookie(res, refreshToken);
  return signAccessToken(user);
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
    res.status(201).json({ token, email: user.email });
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
    res.json({ token, email: user.email });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    const user = await User.findOne({ refreshTokenHash: hashRefreshToken(token) }).select(
      "+refreshTokenHash +refreshTokenExpiresAt",
    );

    if (!user || !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt.getTime() < Date.now()) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const newAccessToken = await issueSession(user, res);
    res.json({ token: newAccessToken, email: user.email });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await User.updateOne(
        { refreshTokenHash: hashRefreshToken(token) },
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
    res.json({ email: user.email });
  } catch (err) {
    next(err);
  }
}
