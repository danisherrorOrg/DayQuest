import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTodayEntry } from "../../hooks/useTodayEntry.js";

// Maps a ModeSelectScreen pick (screen name) to the day-`mode` enum value
// that entry screen seeds from / saves as — "timeline" doesn't share its
// screen name with its mode value.
const SCREEN_TO_MODE = { cards: "cards", timeline: "builder" };

// "sequence" (the old moments-list mode), "timed" and "legacy" are retired
// mode values a day saved before this app's current shape can still carry —
// there's no entry screen left that produces them, so the mismatch dialog
// just names them generically.
const MODE_LABELS = {
  cards: "Log Cards",
  builder: "Timeline Builder",
  sequence: "an earlier version of today's entry",
  timed: "an earlier version of today's entry",
  legacy: "an earlier version of today's entry",
};

export default function ModeSelectScreen({ onPick }) {
  const { email, logout } = useAuth();
  const todayEntry = useTodayEntry();
  const [pendingScreen, setPendingScreen] = useState(null);

  function handlePick(screen) {
    const existingMode = todayEntry?.mode;
    if (existingMode && existingMode !== SCREEN_TO_MODE[screen]) {
      setPendingScreen(screen);
      return;
    }
    onPick(screen);
  }

  function confirmSwitch() {
    onPick(pendingScreen);
    setPendingScreen(null);
  }

  return (
    <div className="screen active">
      <div className="panel">
        <div className="topBar">
          <span className="topBarEmail">{email}</span>
          <button className="backLink" onClick={logout}>
            Log out
          </button>
        </div>
        <h1>Day Story: Run Your Day</h1>
        <p className="sub">
          Choose how you want to log today. Either way, unlogged time just becomes a black box in
          the level — no pressure to remember everything.
        </p>
        <div className="modeCard" onClick={() => handlePick("cards")}>
          <h3>📇 Log it as cards</h3>
          <p>
            Add each activity as its own card — duration, what you did, a note, a category, and
            tags.
          </p>
        </div>
        <div className="modeCard" onClick={() => handlePick("timeline")}>
          <h3>🕒 Drag it on a timeline</h3>
          <p>
            Drag across a 0–24 ruler to block out time for something, resize or move blocks after,
            and leave the rest as black box.
          </p>
        </div>
      </div>

      {pendingScreen && (
        <div className="builderPopupBackdrop" onClick={() => setPendingScreen(null)}>
          <div className="builderPopupSheet" onClick={(e) => e.stopPropagation()}>
            <div className="builderPopupHead">
              <span>Switch entry mode?</span>
            </div>
            <p className="sub" style={{ marginTop: 8 }}>
              You already logged today with {MODE_LABELS[todayEntry.mode] || "a different mode"} —
              switching to {MODE_LABELS[SCREEN_TO_MODE[pendingScreen]]} will replace that entry.
              Continue?
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="primaryBtn" style={{ flex: 1 }} onClick={confirmSwitch}>
                Continue
              </button>
              <button className="ghostBtn" onClick={() => setPendingScreen(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
