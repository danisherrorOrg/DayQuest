import { useEffect, useMemo, useState } from "react";
import { listDays, deleteDay } from "../../api/days.js";
import { formatDisplayDate } from "../../game/date.js";
import { BLACKBOX, formatDuration } from "../../game/activities.js";
import { aggregateDays, withinLastNDays } from "../../game/dayStats.js";
import { buildDayPages, buildDaySummary } from "../../game/dayRecap.js";

const MODE_BADGES = {
  cards: "📇 Log Cards",
  builder: "🕒 Timeline Builder",
};

// "sequence"/"timed"/"legacy" days have no entry screen left to reopen them.
function modeBadge(mode) {
  return MODE_BADGES[mode] || "❔ Legacy entry";
}

// The category the day was mostly spent on, for the timeline rail's dot and
// the card's accent border — same breakdown math the recap screens use, so
// a day's dominant color here always matches what it looks like once open.
function dominantCategory(day) {
  const pages = buildDayPages(day.mode, { cards: day.logCards, blocks: day.timelineBlocks });
  const { breakdown } = buildDaySummary(pages);
  return breakdown[0]?.category || BLACKBOX;
}

export default function MyDaysScreen({ onBack, onSelectDay }) {
  const [days, setDays] = useState(null);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statsRange, setStatsRange] = useState("week");

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

  const stats = useMemo(() => {
    if (!days || days.length === 0) return null;
    const scoped = statsRange === "week" ? withinLastNDays(days, 7) : days;
    return aggregateDays(scoped);
  }, [days, statsRange]);

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

        {stats && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                className={statsRange === "week" ? "primaryBtn" : "ghostBtn"}
                style={{ flex: 1 }}
                onClick={() => setStatsRange("week")}
              >
                This Week
              </button>
              <button
                className={statsRange === "all" ? "primaryBtn" : "ghostBtn"}
                style={{ flex: 1 }}
                onClick={() => setStatsRange("all")}
              >
                All Time
              </button>
            </div>
            <p className="logCardLog">
              {stats.totalDays} day{stats.totalDays === 1 ? "" : "s"} logged
              {stats.totalTrackedMins > 0 && ` · ${formatDuration(stats.totalTrackedMins)} tracked`}
            </p>
            {stats.breakdown.length > 0 && (
              <div className="tagRow" style={{ marginTop: 6 }}>
                {stats.breakdown.map(({ category, mins }) => (
                  <span className="tagChip" key={category.key}>
                    {category.emoji} {formatDuration(mins)} {category.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {days === null && !error && <p className="sub">Loading…</p>}
          {days && days.length === 0 && (
            <div id="emptyMoments">No saved days yet — log today to start one.</div>
          )}
          {days && days.length > 0 && (
            <div className="dayTimeline">
              {days.map((day, i) => {
                const category = dominantCategory(day);
                return (
                  <div className="dayRow" key={day._id || day.date}>
                    <div className="dayRowRail">
                      <span
                        className="dayRowDot"
                        style={{ background: category.color }}
                        aria-hidden="true"
                      >
                        {category.emoji}
                      </span>
                      {i < days.length - 1 && <span className="dayRowLine" />}
                    </div>
                    <div className="logCard dayRowCard" style={{ borderLeftColor: category.color }}>
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
                  </div>
                );
              })}
            </div>
          )}
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
