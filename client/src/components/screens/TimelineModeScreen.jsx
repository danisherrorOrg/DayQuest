import { useState } from "react";
import { ACTIVITIES, BLACKBOX, minutesToLabel } from "../../game/activities.js";
import { SLOT_COUNT } from "../../game/levelBuilder.js";

const PALETTE = [BLACKBOX, ...ACTIVITIES];

export default function TimelineModeScreen({ onBack, onBuild }) {
  const [brush, setBrush] = useState(null);
  const [slots, setSlots] = useState(() => new Array(SLOT_COUNT).fill(null));

  function paintSlot(i) {
    setSlots((prev) => {
      const next = prev.slice();
      next[i] = brush && brush.key ? brush : null; // erase brush (BLACKBOX) or no brush clears the slot
      return next;
    });
  }

  return (
    <div className="screen active">
      <div className="panel" style={{ paddingBottom: 10 }}>
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1 style={{ marginBottom: 2 }}>Build Your Timeline</h1>
        <p className="sub" style={{ marginBottom: 6 }}>
          Pick an activity below, then tap the half-hours you spent on it. Leave the rest blank —
          that&apos;s your black box time.
        </p>

        <div id="palette">
          {PALETTE.map((act) => (
            <div
              key={act.key ?? "erase"}
              className={"chip" + (brush === act ? " selected" : "")}
              style={{ borderColor: brush === act ? "#C1502E" : "transparent" }}
              onClick={() => setBrush(act)}
            >
              <span className="em">{act.emoji}</span>
              <span>{act.key ? act.label : "Erase"}</span>
            </div>
          ))}
        </div>

        <div id="timelineList">
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const filled = slots[i];
            return (
              <div className="slotRow" key={i} onClick={() => paintSlot(i)}>
                <div className="slotTime">{minutesToLabel(i * 30)}</div>
                <div
                  className={"slotFill" + (filled ? " filled" : "")}
                  style={filled ? { background: filled.color } : undefined}
                >
                  {filled ? (
                    <>
                      <span>{filled.emoji}</span>
                      <span>{filled.label}</span>
                    </>
                  ) : (
                    "tap to fill"
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 12 }} />
        <button className="primaryBtn" onClick={() => onBuild(slots)}>
          Build My Level
        </button>
      </div>
    </div>
  );
}
