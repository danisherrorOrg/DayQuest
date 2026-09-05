import { useEffect, useRef, useState } from "react";
import { guessActivityFromText, minutesToLabel } from "../../game/activities.js";
import { useTodayEntry } from "../../hooks/useTodayEntry.js";

export default function MomentsModeScreen({ onBack, onBuild }) {
  const [moments, setMoments] = useState([]);
  const [text, setText] = useState("");
  const [showTime, setShowTime] = useState(false);
  const [time, setTime] = useState("");
  const [continuedFromToday, setContinuedFromToday] = useState(false);
  const todayEntry = useTodayEntry();
  const seededRef = useRef(false);

  // If today already has a saved "sequence" (moments) day, pick up where it
  // left off instead of starting blank.
  useEffect(() => {
    if (seededRef.current || !todayEntry || todayEntry.mode !== "sequence") return;
    seededRef.current = true;
    setMoments((todayEntry.moments || []).map((m) => ({ text: m.text, time: m.time ?? null })));
    setContinuedFromToday(true);
  }, [todayEntry]);

  function addMoment() {
    const trimmed = text.trim();
    if (!trimmed) return;
    let mins = null;
    if (showTime && time) {
      const [h, m] = time.split(":").map(Number);
      mins = h * 60 + m;
    }
    setMoments((prev) => [...prev, { text: trimmed, time: mins }]);
    setText("");
    setTime("");
    setShowTime(false);
  }

  function moveUp(i) {
    if (i === 0) return;
    setMoments((prev) => {
      const next = prev.slice();
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  }

  function moveDown(i) {
    setMoments((prev) => {
      if (i >= prev.length - 1) return prev;
      const next = prev.slice();
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      return next;
    });
  }

  function remove(i) {
    setMoments((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="screen active">
      <div className="panel" style={{ paddingBottom: 10 }}>
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1 style={{ marginBottom: 2 }}>Your Day, In Order</h1>
        <p className="sub" style={{ marginBottom: 6 }}>
          Add what you did, top to bottom. A time is optional for each one.
        </p>
        {continuedFromToday && (
          <p className="sub" style={{ marginBottom: 6 }}>
            Picking up where you left off today.
          </p>
        )}

        <div id="momentsList" style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
          {moments.length === 0 && (
            <div id="emptyMoments">No moments yet — add your first one below.</div>
          )}
          {moments.map((m, i) => {
            const act = guessActivityFromText(m.text);
            return (
              <div className="momentRow" key={i}>
                <div className="momentTrack">
                  <div className="momentDot" style={{ background: act.color }} />
                  {i < moments.length - 1 && <div className="momentLine" />}
                </div>
                <div className="momentCard">
                  <div className="mText">
                    {act.emoji} {m.text}
                  </div>
                  <div className="mTime">
                    {m.time != null ? minutesToLabel(m.time) : "no time noted"}
                  </div>
                  <div className="momentActions">
                    {i > 0 && <button onClick={() => moveUp(i)}>▲ move up</button>}
                    {i < moments.length - 1 && (
                      <button onClick={() => moveDown(i)}>▼ move down</button>
                    )}
                    <button onClick={() => remove(i)}>✕ remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div id="momentForm">
          <input
            type="text"
            id="momentText"
            placeholder="What did you do?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div id="momentTimeRow">
            <button type="button" id="momentTimeToggle" onClick={() => setShowTime((s) => !s)}>
              {showTime ? "remove time" : "+ add a time"}
            </button>
            {showTime && (
              <input
                type="time"
                id="momentTime"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            )}
          </div>
          <button
            className="primaryBtn"
            id="addMomentBtn"
            style={{ marginTop: 8, width: "100%" }}
            disabled={text.trim().length === 0}
            onClick={addMoment}
          >
            Add Moment
          </button>
        </div>

        <div style={{ height: 10 }} />
        <button
          className="primaryBtn"
          disabled={moments.length === 0}
          style={{ background: "#3F5B6B" }}
          onClick={() => onBuild(moments)}
        >
          Build My Level
        </button>
      </div>
    </div>
  );
}
