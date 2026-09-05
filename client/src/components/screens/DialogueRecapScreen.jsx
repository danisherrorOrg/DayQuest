import { useEffect, useMemo, useRef, useState } from "react";
import { BLACKBOX, formatDuration } from "../../game/activities.js";
import {
  buildDayPages,
  buildDaySummary,
  buildSummaryText,
  pageBody,
  pageNameplate,
} from "../../game/dayRecap.js";
import { drawGroundBand, drawPlayerSprite, drawSky, shade } from "../../game/sprites.js";
import { saveDay } from "../../api/days.js";

const REVEAL_MS_PER_CHAR = 18;
const STAGE_W = 320;
const STAGE_H = 130;
const GROUND_H = 40;

function StageCanvas({ page }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawSky(ctx, STAGE_W, STAGE_H);

    const isFiller = page.kind === "filler";
    const groundColor = isFiller ? BLACKBOX.color : page.category.color;
    const groundY = STAGE_H - GROUND_H;
    drawGroundBand(ctx, {
      x: 0,
      y: groundY,
      width: STAGE_W,
      height: GROUND_H,
      topColor: groundColor,
      bodyColor: shade(groundColor, -25),
    });

    drawPlayerSprite(ctx, {
      cx: STAGE_W / 2,
      cy: groundY - 9,
      w: 22,
      h: 34,
      bodyColor: isFiller ? "#5A5568" : groundColor,
    });
  }, [page]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
}

export default function DialogueRecapScreen({ mode, cards, blocks, moments, onRestart }) {
  const pages = useMemo(
    () => buildDayPages(mode, { cards, blocks, moments }),
    [mode, cards, blocks, moments],
  );

  const [pageIndex, setPageIndex] = useState(0);
  const [revealedChars, setRevealedChars] = useState(0);
  const [done, setDone] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error | offline
  const revealTimer = useRef(null);

  const page = pages[pageIndex];
  const body = page ? pageBody(page) : "";
  const nameplate = page ? pageNameplate(page) : "";
  const isRevealing = revealedChars < body.length;

  useEffect(() => {
    setRevealedChars(0);
    clearInterval(revealTimer.current);
    if (!body) return undefined;
    revealTimer.current = setInterval(() => {
      setRevealedChars((n) => {
        if (n + 1 >= body.length) {
          clearInterval(revealTimer.current);
          return body.length;
        }
        return n + 1;
      });
    }, REVEAL_MS_PER_CHAR);
    return () => clearInterval(revealTimer.current);
  }, [pageIndex, body]);

  function advance() {
    if (isRevealing) {
      clearInterval(revealTimer.current);
      setRevealedChars(body.length);
      return;
    }
    if (pageIndex + 1 < pages.length) {
      setPageIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  useEffect(() => {
    if (done) return undefined;
    function onKeyDown(e) {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, isRevealing, body, pageIndex, pages.length]);

  const summary = useMemo(() => buildDaySummary(pages), [pages]);
  const summaryText = useMemo(() => buildSummaryText(pages), [pages]);

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const entry = {
        mode,
        moments: mode === "sequence" ? moments : null,
        logCards:
          mode === "cards"
            ? cards.map((c) => ({
                title: c.title,
                log: c.log,
                categoryKey: c.categoryKey,
                tags: c.tags,
                durationMins: c.durationMins,
              }))
            : null,
        timelineBlocks:
          mode === "builder"
            ? blocks.map((b) => ({
                start: b.start,
                end: b.end,
                title: b.title,
                log: b.log,
                categoryKey: b.categoryKey,
                tags: b.tags,
              }))
            : null,
        summary: summaryText,
      };
      await saveDay(date, entry);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus(err.isNetworkError ? "offline" : "error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 1600);
    }
  }

  const saveLabel = {
    idle: "Save This Day",
    saving: "Saving...",
    saved: "Saved ✓",
    error: "Could not save",
    offline: "Offline — try again",
  }[saveStatus];

  if (done) {
    return (
      <div className="screen active" id="recapScreen">
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
          <div
            id="timelineRecap"
            style={{ display: summary.breakdown.length ? undefined : "none" }}
          >
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
            <button
              className="endBtn"
              id="saveBtn"
              disabled={saveStatus === "saving"}
              onClick={handleSave}
            >
              {saveLabel}
            </button>
            <button className="endBtn" id="againBtn" onClick={onRestart}>
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" id="recapScreen">
      <div id="dialogueStage">
        <StageCanvas page={page} />
        <span className="dialoguePageCount">
          {pageIndex + 1} / {pages.length}
        </span>
        <span className="dialoguePageBadge">
          {page.kind === "filler" ? "❔" : page.category.emoji}
        </span>
      </div>
      <div id="dialogueBox" onClick={advance} role="button" tabIndex={0}>
        <div className="dialogueNameplate">{nameplate}</div>
        <div className="dialogueText">{body.slice(0, revealedChars)}</div>
        <div className="dialogueAdvance">▼ press to continue</div>
      </div>
    </div>
  );
}
