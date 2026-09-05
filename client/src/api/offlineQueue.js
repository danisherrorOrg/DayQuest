const PENDING_SAVE_KEY = "dayStory.pendingSave";

// A single pending-save slot, not a general queue — a user only ever has
// one day in flight at a time, so the last save attempt that failed while
// offline is the only one worth remembering.
export function getPendingSave() {
  try {
    const raw = localStorage.getItem(PENDING_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPendingSave(date, entry) {
  try {
    localStorage.setItem(PENDING_SAVE_KEY, JSON.stringify({ date, entry }));
  } catch {
    // Storage unavailable/full — the save attempt already failed anyway;
    // there's nothing more to do here.
  }
}

export function clearPendingSave() {
  try {
    localStorage.removeItem(PENDING_SAVE_KEY);
  } catch {
    // ignore
  }
}
