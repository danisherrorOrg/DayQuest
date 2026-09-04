import { useEffect, useRef, useState } from "react";
import { GameEngine } from "../../game/engine.js";
import { buildSummary } from "../../game/levelBuilder.js";
import { saveDay } from "../../api/days.js";

export default function GameScreen({ mode, timeline, activities, moments, builtLevel, onRestart }) {
  const canvasWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const popupTimeoutRef = useRef(null);

  const [gotIndices, setGotIndices] = useState(() => new Set());
  const [popup, setPopup] = useState({ msg: "", visible: false });
  const [finished, setFinished] = useState(null); // { summaryText, badgeItems, recapRows, hasTimeLabels }
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  useEffect(() => {
    const engine = new GameEngine(canvasRef.current, canvasWrapRef.current, {
      onPopup(msg) {
        clearTimeout(popupTimeoutRef.current);
        setPopup({ msg, visible: true });
        popupTimeoutRef.current = setTimeout(() => setPopup((p) => ({ ...p, visible: false })), 1200);
      },
      onCoinCollected(idx) {
        setGotIndices((prev) => new Set(prev).add(idx));
      },
      onFinish() {
        const items = builtLevel.coins.map((c) => c.act);
        setFinished({
          summaryText: buildSummary(items),
          badgeItems: items.filter((a) => a.key),
          recapRows: builtLevel.coins.map((c) => ({ timeLabel: c.timeLabel, act: c.act })),
          hasTimeLabels: builtLevel.coins.some((c) => c.timeLabel),
        });
      },
    });
    engineRef.current = engine;
    engine.start(builtLevel);

    function onKeyDown(e) {
      if (e.key === "ArrowLeft") engine.setInput("left", true);
      if (e.key === "ArrowRight") engine.setInput("right", true);
      if (e.key === " " || e.key === "ArrowUp") engine.jump();
    }
    function onKeyUp(e) {
      if (e.key === "ArrowLeft") engine.setInput("left", false);
      if (e.key === "ArrowRight") engine.setInput("right", false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearTimeout(popupTimeoutRef.current);
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bindHoldProps(dir) {
    const engine = () => engineRef.current;
    return {
      onMouseDown: () => engine().setInput(dir, true),
      onMouseUp: () => engine().setInput(dir, false),
      onMouseLeave: () => engine().setInput(dir, false),
      onTouchStart: (e) => { e.preventDefault(); engine().setInput(dir, true); },
      onTouchEnd: (e) => { e.preventDefault(); engine().setInput(dir, false); },
    };
  }

  function doJump(e) {
    e?.preventDefault?.();
    engineRef.current.jump();
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const entry = {
        mode,
        timeline: mode === "timed"
          ? timeline.map((s) => ({ start: s.start, end: s.end, key: s.act.key, label: s.act.label, emoji: s.act.emoji, color: s.act.color }))
          : null,
        activities: mode === "legacy" ? activities.map((a) => a.key) : null,
        moments: mode === "sequence" ? moments : null,
        summary: finished.summaryText,
      };
      await saveDay(date, entry);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 1600);
    }
  }

  const saveLabel = { idle: "Save This Day", saving: "Saving...", saved: "Saved ✓", error: "Could not save" }[saveStatus];

  return (
    <div className="screen active" id="gameScreen">
      <div id="hud">
        {builtLevel.coins.map((c, idx) => (
          <div key={idx} className={"badge" + (gotIndices.has(idx) ? " got" : "")}>{c.act.emoji}</div>
        ))}
      </div>
      <div id="canvasWrap" ref={canvasWrapRef}>
        <canvas id="game" ref={canvasRef} />
        <div id="popup" className={popup.visible ? "show" : ""}>{popup.msg}</div>
        {finished && (
          <div id="completeOverlay" style={{ display: "flex" }}>
            <h2>Day Complete!</h2>
            <p className="desc">{finished.summaryText}</p>
            <div id="badgeRow">
              {finished.badgeItems.map((a, i) => (
                <div key={i} className="cbadge" style={{ background: a.color }}>{a.emoji}</div>
              ))}
            </div>
            <div id="timelineRecap" style={{ display: finished.hasTimeLabels ? undefined : "none" }}>
              {finished.recapRows.map((row, i) => (
                <div className="recapRow" key={i}>
                  <span className="rt">{row.timeLabel || ""}</span>
                  <span className="rl">{row.act.emoji} {row.act.label}</span>
                </div>
              ))}
            </div>
            <div className="endBtns">
              <button className="endBtn" id="saveBtn" disabled={saveStatus === "saving"} onClick={handleSave}>{saveLabel}</button>
              <button className="endBtn" id="againBtn" onClick={onRestart}>Start Over</button>
            </div>
          </div>
        )}
      </div>
      <div id="controls">
        <div id="dpad">
          <button className="ctrlBtn" id="leftBtn" {...bindHoldProps("left")}>◀</button>
          <button className="ctrlBtn" id="rightBtn" {...bindHoldProps("right")}>▶</button>
        </div>
        <button className="ctrlBtn" id="jumpBtn" onClick={doJump} onTouchStart={doJump}>JUMP</button>
      </div>
    </div>
  );
}
