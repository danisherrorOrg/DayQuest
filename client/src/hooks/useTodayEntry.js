import { useEffect, useState } from "react";
import { getDay } from "../api/days.js";
import { todayDateString } from "../game/date.js";

// Loads whatever was already saved for today, if anything, so an entry
// screen can seed its list state instead of starting blank — lets a second
// logging session the same day add to the first instead of overwriting it.
// Silently stays null on a 404 (nothing saved yet for today) or any other
// failure (offline, etc); the screen just starts blank in that case, same
// as before this existed.
export function useTodayEntry() {
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDay(todayDateString())
      .then((day) => {
        if (!cancelled) setEntry(day);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return entry;
}
