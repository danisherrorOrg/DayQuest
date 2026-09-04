import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth } from "./auth.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a header that isn't a Bearer token", () => {
    const req = { headers: { authorization: "Basic abc123" } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a malformed token", () => {
    const req = { headers: { authorization: "Bearer not-a-real-token" } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a token signed with the wrong secret", () => {
    const token = jwt.sign({ sub: "abc123" }, "wrong-secret", { algorithm: "HS256" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ sub: "abc123" }, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: -1,
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token and sets req.userId from its subject", () => {
    const token = jwt.sign({ sub: "abc123" }, process.env.JWT_SECRET, { algorithm: "HS256" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.userId).toBe("abc123");
    expect(res.status).not.toHaveBeenCalled();
  });
});
