import { describe, it, expect, beforeEach } from "vitest";
import { getPendingSave, setPendingSave, clearPendingSave } from "./offlineQueue.js";

// The test environment is plain Node (no jsdom), so localStorage isn't
// globally defined here the way it would be in a browser — stub a minimal
// in-memory version rather than pulling in a DOM environment for one file.
function makeMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

beforeEach(() => {
  globalThis.localStorage = makeMemoryStorage();
});

describe("offlineQueue", () => {
  it("returns null when nothing is pending", () => {
    expect(getPendingSave()).toBeNull();
  });

  it("round-trips a pending save", () => {
    setPendingSave("2026-09-05", { mode: "cards" });
    expect(getPendingSave()).toEqual({ date: "2026-09-05", entry: { mode: "cards" } });
  });

  it("clears the pending save", () => {
    setPendingSave("2026-09-05", { mode: "cards" });
    clearPendingSave();
    expect(getPendingSave()).toBeNull();
  });

  it("fails gracefully when localStorage throws", () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => setPendingSave("2026-09-05", {})).not.toThrow();
    expect(getPendingSave()).toBeNull();
    expect(() => clearPendingSave()).not.toThrow();
  });
});
