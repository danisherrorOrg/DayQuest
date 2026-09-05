import { useEffect, useState } from "react";
import { listDays, deleteDay } from "../../api/days.js";
import { formatDisplayDate } from "../../game/date.js";

const MODE_BADGES = {
  cards: "📇 Log Cards",
  builder: "🕒 Timeline Builder",
};

// "sequence"/"timed"/"legacy" days have no entry screen left to reopen them.
function modeBadge(mode) {
  return MODE_BADGES[mode] || "❔ Legacy entry";
}

export default function MyDaysScreen({ onBack, onSelectDay }) {
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  function askDelete(day) {
    setDeleteError(null);
    setPendingDelete(day);
  }

  async function confirmDelete() {
    const day = pendingDelete;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDay(day.date);
      setDays((prev) => prev.filter((d) => d.date !== day.date));
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

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
                <div className="momentActions">
                  <button onClick={() => onSelectDay(day)}>▶ view recap</button>
                  <button onClick={() => askDelete(day)}>✕ delete</button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {pendingDelete && (
        <div className="builderPopupBackdrop" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="builderPopupSheet" onClick={(e) => e.stopPropagation()}>
            <div className="builderPopupHead">
              <span>Delete this day?</span>
            </div>
            <p className="sub" style={{ marginTop: 8 }}>
              This permanently deletes your {formatDisplayDate(pendingDelete.date)} entry. This
              can&apos;t be undone.
            </p>
            {deleteError && <p className="authError">{deleteError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="primaryBtn"
                style={{ flex: 1 }}
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                className="ghostBtn"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
