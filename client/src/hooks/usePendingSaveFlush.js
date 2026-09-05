import { useEffect, useRef, useState } from "react";
import { saveDay } from "../api/days.js";
import { useOnlineStatus } from "./useOnlineStatus.js";
import { getPendingSave, clearPendingSave } from "../api/offlineQueue.js";

// Retries a save that previously failed while offline (queued by
// useDaySave via setPendingSave), once the browser reports being back
// online — including right on mount, in case connectivity returned while
// the app wasn't open. Runs independently of whichever screen is active,
// since the user may have already navigated away from the recap screen by
// the time the connection comes back.
export function usePendingSaveFlush() {
  const online = useOnlineStatus();
  const flushingRef = useRef(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    if (!online || flushingRef.current) return;
    const pending = getPendingSave();
    if (!pending) return;

    flushingRef.current = true;
    saveDay(pending.date, pending.entry)
      .then(() => {
        clearPendingSave();
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      })
      .catch(() => {
        // Still failing (still offline, or something else) — leave it
        // queued and try again the next time `online` flips true.
      })
      .finally(() => {
        flushingRef.current = false;
      });
  }, [online]);

  return justSynced;
}
