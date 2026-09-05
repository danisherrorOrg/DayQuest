import { useState } from "react";
import { formatDuration } from "../../game/activities.js";
import { downloadRecapImage } from "../../game/recapImage.js";

// The end-of-day summary + save/restart flow, shared by both review modes
// (dialogue recap and chrono bar) so they end up in the same place.
export default function DayCompleteOverlay({
  date,
  summary,
  summaryText,
  saveStatus,
  saveLabel,
  onSave,
  onRestart,
  restartLabel = "Start Over",
  showSave = true,
}) {
  const [exportStatus, setExportStatus] = useState("idle");

  function handleExport() {
    downloadRecapImage({ date, summary, summaryText });
    setExportStatus("exported");
    setTimeout(() => setExportStatus("idle"), 1600);
  }

  return (
    <div id="completeOverlay" style={{ position: "static", flex: 1, display: "flex" }}>
      <h2>Day Complete!</h2>
      <p className="desc">{summaryText}</p>
      <div id="badgeRow">
        {summary.breakdown.map(({ category }) => (
          <div key={category.key} className="cbadge" style={{ background: category.color }}>
            {category.emoji}
          </div>
        ))}
      </div>
      <div id="timelineRecap" style={{ display: summary.breakdown.length ? undefined : "none" }}>
        {summary.breakdown.map(({ category, mins }) => (
          <div className="recapRow" key={category.key}>
            <span className="rt">{formatDuration(mins)}</span>
            <span className="rl">
              {category.emoji} {category.label}
            </span>
          </div>
        ))}
        <div className="recapRow">
          <span className="rt">{formatDuration(summary.totalTrackedMins)}</span>
          <span className="rl">total tracked</span>
        </div>
      </div>
      <div className="endBtns">
        <button className="endBtn" id="exportBtn" onClick={handleExport}>
          {exportStatus === "exported" ? "Exported ✓" : "🖼️ Export Image"}
        </button>
        {showSave && (
          <button
            className="endBtn"
            id="saveBtn"
            disabled={saveStatus === "saving"}
            onClick={onSave}
          >
            {saveLabel}
          </button>
        )}
        <button className="endBtn" id="againBtn" onClick={onRestart}>
          {restartLabel}
        </button>
      </div>
    </div>
  );
}
