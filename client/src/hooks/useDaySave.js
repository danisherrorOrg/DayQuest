import { useState } from "react";
import { saveDay } from "../api/days.js";
import { todayDateString } from "../game/date.js";

const SAVE_LABELS = {
  idle: "Save This Day",
  saving: "Saving...",
  saved: "Saved ✓",
  error: "Could not save",
  offline: "Offline — try again",
};

// Shared by both review modes (dialogue recap and chrono bar) so the save
// payload shape and status handling only live in one place.
export function useDaySave({ mode, cards, blocks, moments, summaryText }) {
  const [saveStatus, setSaveStatus] = useState("idle");

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const date = todayDateString();
      const entry = {
        mode,
        moments: mode === "sequence" ? moments : null,
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
      await saveDay(date, entry);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus(err.isNetworkError ? "offline" : "error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 1600);
    }
  }

  return { saveStatus, saveLabel: SAVE_LABELS[saveStatus], handleSave };
}
