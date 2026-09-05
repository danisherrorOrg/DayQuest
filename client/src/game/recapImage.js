// Renders the end-of-day summary (the same data DayCompleteOverlay shows)
// onto an offscreen canvas as a shareable PNG card — plain Canvas 2D, no
// extra dependency, matching the drawing approach already used for the
// dialogue stage backdrop (see sprites.js).
import { formatDuration } from "./activities.js";
import { formatDisplayDate } from "./date.js";

const WIDTH = 720;
const PAD = 48;
const INNER_W = WIDTH - PAD * 2;

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// A throwaway canvas just for text measurement, so line-wrapping can happen
// before the real canvas (which needs a final height up front) is created.
function measuringCtx() {
  return document.createElement("canvas").getContext("2d");
}

const SUMMARY_FONT = '15px "Segoe UI", system-ui, sans-serif';
const ROW_H = 34;
const BADGE_R = 20;

export function buildRecapCanvas({ date, summary, summaryText }) {
  const mctx = measuringCtx();
  mctx.font = SUMMARY_FONT;
  const summaryLines = wrapText(mctx, summaryText, INNER_W);

  const headerH = 132;
  const summaryH = summaryLines.length * 22 + 16;
  const badgeH = summary.breakdown.length ? BADGE_R * 2 + 28 : 0;
  const breakdownH = (summary.breakdown.length + 1) * ROW_H + 24;
  const footerH = 56;
  const height = headerH + summaryH + badgeH + breakdownH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#241a3a");
  bg.addColorStop(1, "#140e20");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, height);

  let y = PAD;
  ctx.fillStyle = "#b79f82";
  ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
  ctx.textBaseline = "top";
  ctx.fillText("DAY STORY", PAD, y);

  y += 26;
  ctx.fillStyle = "#fff8ec";
  ctx.font = "28px Georgia, serif";
  ctx.fillText(formatDisplayDate(date), PAD, y);

  y += 56;
  ctx.fillStyle = "#e8d2b0";
  ctx.font = SUMMARY_FONT;
  for (const line of summaryLines) {
    ctx.fillText(line, PAD, y);
    y += 22;
  }
  y += 16;

  if (summary.breakdown.length) {
    let x = PAD + BADGE_R;
    const rowTop = y;
    for (const { category } of summary.breakdown) {
      if (x + BADGE_R > WIDTH - PAD) {
        x = PAD + BADGE_R;
        y += BADGE_R * 2 + 10;
      }
      ctx.fillStyle = category.color;
      ctx.beginPath();
      ctx.arc(x, y + BADGE_R, BADGE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(category.emoji, x, y + BADGE_R - 10);
      ctx.textAlign = "left";
      x += BADGE_R * 2 + 8;
    }
    y = rowTop + BADGE_R * 2 + 28;
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  const cardH = (summary.breakdown.length + 1) * ROW_H + 24;
  ctx.fillRect(PAD, y, INNER_W, cardH);
  y += 16;

  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  for (const { category, mins } of summary.breakdown) {
    ctx.fillStyle = "#b79f82";
    ctx.fillText(formatDuration(mins), PAD + 16, y + 4);
    ctx.fillStyle = "#fff8ec";
    ctx.fillText(`${category.emoji} ${category.label}`, PAD + 108, y + 4);
    y += ROW_H;
  }
  ctx.fillStyle = "#b79f82";
  ctx.fillText(formatDuration(summary.totalTrackedMins), PAD + 16, y + 4);
  ctx.fillStyle = "#fff8ec";
  ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("total tracked", PAD + 108, y + 4);

  y += ROW_H + 32;
  ctx.textAlign = "center";
  ctx.fillStyle = "#6f6280";
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText("Made with Day Story", WIDTH / 2, y);
  ctx.textAlign = "left";

  return canvas;
}

export function downloadRecapImage(opts) {
  const canvas = buildRecapCanvas(opts);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `day-story-${opts.date}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
