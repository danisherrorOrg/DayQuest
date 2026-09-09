import { useState } from "react";
import { saveDay } from "../api/days.js";
import { todayDateString } from "../game/date.js";
import { setPendingSave, clearPendingSave } from "../api/offlineQueue.js";
import { useToast } from "../context/ToastContext.jsx";

const SAVE_LABELS = {
  idle: "Save This Day",
  saving: "Saving...",
  saved: "Saved ✓",
  error: "Could not save",
  offline: "Offline — try again",
};

// Shared by both review modes (dialogue recap and chrono bar) so the save
// payload shape and status handling only live in one place.
export function useDaySave({ mode, cards, blocks, summaryText }) {
  const [saveStatus, setSaveStatus] = useState("idle");
  const showToast = useToast();

  async function handleSave() {
    setSaveStatus("saving");
    const date = todayDateString();
    const entry = {
      mode,
      moments: null,
      logCards:
        mode === "cards"
          ? cards.map((c) => ({
              title: c.title,
              log: c.log,
              categoryKey: c.categoryKey,
              tags: c.tags,
              durationMins: c.durationMins,
            }))
          : null,
      timelineBlocks:
        mode === "builder"
          ? blocks.map((b) => ({
              start: b.start,
              end: b.end,
              title: b.title,
              log: b.log,
              categoryKey: b.categoryKey,
              tags: b.tags,
            }))
          : null,
      summary: summaryText,
    };
    try {
      await saveDay(date, entry);
      clearPendingSave();
      setSaveStatus("saved");
      showToast("Day saved ✓");
    } catch (err) {
      // Persisted so it survives a tab close/refresh — usePendingSaveFlush
      // retries it automatically once the connection comes back, even if
      // the user has already navigated away from this screen by then.
      if (err.isNetworkError) setPendingSave(date, entry);
      setSaveStatus(err.isNetworkError ? "offline" : "error");
      showToast(
        err.isNetworkError ? "Offline — we'll save it when you're back" : "Could not save",
        "error",
      );
    } finally {
      setTimeout(() => setSaveStatus("idle"), 1600);
    }
  }

  return { saveStatus, saveLabel: SAVE_LABELS[saveStatus], handleSave };
}
