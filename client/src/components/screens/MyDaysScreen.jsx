import { useEffect, useState } from "react";
import { listDays } from "../../api/days.js";
import { formatDisplayDate } from "../../game/date.js";

const MODE_BADGES = {
  cards: "📇 Log Cards",
  builder: "🕒 Timeline Builder",
};

// "sequence"/"timed"/"legacy" days have no entry screen left to reopen them.
function modeBadge(mode) {
  return MODE_BADGES[mode] || "❔ Legacy entry";
}

export default function MyDaysScreen({ onBack }) {
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listDays()
      .then((data) => {
        if (!cancelled) setDays(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="screen active">
      <div className="panel">
        <div className="backRow">
          <button className="backLink" onClick={onBack}>
            ← Back
          </button>
        </div>
        <h1 style={{ marginBottom: 2 }}>My Days</h1>
        <p className="sub" style={{ marginBottom: 6 }}>
          Every day you&apos;ve saved, newest first.
        </p>

        {error && <p className="authError">{error}</p>}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {days === null && !error && <p className="sub">Loading…</p>}
          {days && days.length === 0 && (
            <div id="emptyMoments">No saved days yet — log today to start one.</div>
          )}
          {days &&
            days.map((day) => (
              <div className="logCard" key={day._id || day.date}>
                <div className="logCardHead">
                  <span className="logCardTitle">{formatDisplayDate(day.date)}</span>
                  <span className="logCardDuration">{modeBadge(day.mode)}</span>
                </div>
                {day.summary && <div className="logCardLog">{day.summary}</div>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
