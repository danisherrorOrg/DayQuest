import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDayPages,
  buildDaySegments,
  buildDaySummary,
  buildSummaryText,
} from "../../game/dayRecap.js";
import { minutesToLabel } from "../../game/activities.js";
import { useDaySave } from "../../hooks/useDaySave.js";
import DayCompleteOverlay from "./DayCompleteOverlay.jsx";
import ReviewTabs from "./ReviewTabs.jsx";

const DAY_MINUTES = 1440;

// Hour -> sky color. Dark at both ends of the day, brightest at noon, with a
// warm glow at sunrise/sunset — a visual echo of the 0–24 axis, not a
// literal sky simulation.
const SKY_STOPS = [
  { hour: 0, color: "#0b1026" },
  { hour: 4, color: "#131b3a" },
  { hour: 6, color: "#f2a65a" },
  { hour: 8, color: "#bee7fa" },
  { hour: 12, color: "#cff0ff" },
  { hour: 16, color: "#bee7fa" },
  { hour: 18, color: "#f2745a" },
  { hour: 20, color: "#1b1b3a" },
  { hour: 24, color: "#0b1026" },
];

const SKY_GRADIENT = `linear-gradient(to right, ${SKY_STOPS.map(
  (s) => `${s.color} ${(s.hour / 24) * 100}%`,
).join(", ")})`;

const TICK_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function tickLabel(hour) {
  return minutesToLabel((hour % 24) * 60).replace(":00", "");
}

// Where the sun/moon glyph sits: an arc that rises from the bar at sunrise
// (day) or sunset (night), peaks above the midpoint of its half, and sets
// back down at the other end.
function glyphPosition(hourFraction) {
  const isDay = hourFraction >= 6 && hourFraction < 18;
  const phase = isDay ? (hourFraction - 6) / 12 : ((hourFraction - 18 + 24) % 24) / 12;
  const arc = Math.sin(clamp(phase, 0, 1) * Math.PI);
  return {
    isDay,
    leftPct: (hourFraction / 24) * 100,
    topPct: 100 - arc * 85,
  };
}

export default function ChronoBarScreen({
  mode,
  cards,
  blocks,
  onRestart,
  reviewView,
  onChangeReviewView,
  onJumpToBuilder,
}) {
  const segments = useMemo(() => buildDaySegments(mode, { cards, blocks }), [mode, cards, blocks]);
  const pages = useMemo(() => buildDayPages(mode, { cards, blocks }), [mode, cards, blocks]);
  const summary = useMemo(() => buildDaySummary(pages), [pages]);
  const summaryText = useMemo(() => buildSummaryText(pages), [pages]);

  const [openId, setOpenId] = useState(null);
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [barWidth, setBarWidth] = useState(320);
  const barRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function measure() {
      if (barRef.current) setBarWidth(barRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { saveStatus, saveLabel, handleSave } = useDaySave({
    mode,
    cards,
    blocks,
    summaryText,
  });

  const hourFraction = now.getHours() + now.getMinutes() / 60;
  const glyph = glyphPosition(hourFraction);
  const active = segments.find((s) => s.id === openId) || null;

  function handleBarClick(e) {
    if (!onJumpToBuilder || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    onJumpToBuilder(Math.round(frac * DAY_MINUTES));
  }

  if (done) {
    return (
      <div className="screen active" id="chronoScreen">
        <DayCompleteOverlay
          summary={summary}
          summaryText={summaryText}
          saveStatus={saveStatus}
          saveLabel={saveLabel}
          onSave={handleSave}
          onRestart={onRestart}
        />
      </div>
    );
  }

  return (
    <div className="screen active" id="chronoScreen">
      {reviewView && <ReviewTabs value={reviewView} onChange={onChangeReviewView} />}

      <div className="chronoHead">
        <h2>Today, At a Glance</h2>
        <p className="chronoSub">
          {onJumpToBuilder
            ? "Hover or tap a segment for details, or tap empty space to add something there."
            : "Hover or tap a segment for details."}
        </p>
      </div>

      <div className="chronoArcStage">
        <span
          className="chronoGlyph"
          style={{ left: `${glyph.leftPct}%`, top: `${glyph.topPct}%` }}
        >
          {glyph.isDay ? "☀️" : "🌙"}
        </span>
      </div>

      <div className="chronoBarWrap">
        <div
          className="chronoBar"
          ref={barRef}
          style={{ background: SKY_GRADIENT }}
          onClick={handleBarClick}
        >
          {segments.map((seg) => {
            const leftPct = (seg.start / DAY_MINUTES) * 100;
            const widthPct = ((seg.end - seg.start) / DAY_MINUTES) * 100;
            return (
              <div
                key={seg.id}
                className={
                  "chronoSegment" +
                  (seg.isPoint ? " point" : "") +
                  (openId === seg.id ? " open" : "")
                }
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: seg.category.color,
                }}
                onMouseEnter={() => setOpenId(seg.id)}
                onMouseLeave={() => setOpenId((id) => (id === seg.id ? null : id))}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenId((id) => (id === seg.id ? null : seg.id));
                }}
              >
                {seg.isPoint ? (
                  <span className="chronoPin center" />
                ) : (
                  <>
                    <span className="chronoPin left" />
                    <span className="chronoPin right" />
                  </>
                )}
              </div>
            );
          })}

          {active && (
            <div
              className="chronoPopup"
              style={{
                left: `${clamp(
                  ((active.start + active.end) / 2 / DAY_MINUTES) * barWidth,
                  104,
                  barWidth - 104,
                )}px`,
              }}
            >
              <div className="chronoPopupHead">
                {active.category.emoji} {active.title}
              </div>
              <div className="chronoPopupTime">{active.timeLabel}</div>
              {active.log && <div className="chronoPopupLog">{active.log}</div>}
              {active.tags.length > 0 && (
                <div className="tagRow" style={{ marginTop: 6 }}>
                  {active.tags.map((t) => (
                    <span className="tagChip" key={t}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="chronoTicks">
          {TICK_HOURS.map((hour) => (
            <span key={hour} className="chronoTick" style={{ left: `${(hour / 24) * 100}%` }}>
              {tickLabel(hour)}
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div className="endBtns" style={{ padding: "0 18px 16px" }}>
        <button className="endBtn" id="chronoFinishBtn" onClick={() => setDone(true)}>
          Finish &amp; Save
        </button>
      </div>
    </div>
  );
}
