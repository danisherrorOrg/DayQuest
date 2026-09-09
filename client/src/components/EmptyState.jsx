import { useEffect, useRef } from "react";
import { drawGroundBand, drawPlayerSprite, shade } from "../game/sprites.js";

const STAGE_W = 72;
const STAGE_H = 72;
const GROUND_H = 16;

// A small static render of the recap screens' pixel character standing on
// a strip of ground, reusing the same sprite helpers — so an empty list
// leans on the character the game's premise is built around instead of
// just printing gray placeholder text.
function CharacterGlyph({ color }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = STAGE_W * dpr;
    canvas.height = STAGE_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);

    const groundY = STAGE_H - GROUND_H;
    drawGroundBand(ctx, {
      x: 0,
      y: groundY,
      width: STAGE_W,
      height: GROUND_H,
      topColor: color,
      bodyColor: shade(color, -25),
    });
    drawPlayerSprite(ctx, {
      cx: STAGE_W / 2,
      cy: groundY - 7,
      w: 18,
      h: 28,
      bodyColor: color,
    });
  }, [color]);

  return <canvas ref={canvasRef} style={{ width: STAGE_W, height: STAGE_H }} aria-hidden="true" />;
}

export default function EmptyState({ message, color = "#9a7a56" }) {
  return (
    <div className="emptyState">
      <CharacterGlyph color={color} />
      <p className="emptyStateText">{message}</p>
    </div>
  );
}
