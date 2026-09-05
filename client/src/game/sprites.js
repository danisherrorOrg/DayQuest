// Small canvas drawing helpers reusing the retired platformer's exact visual
// style (sky gradient, ground band, player figure) so the dialogue recap's
// backdrop looks like it belongs to the same game, not new art.

export function drawSky(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#4A3B6B");
  grad.addColorStop(1, "#1E1732");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawGroundBand(ctx, { x, y, width, height, topColor, bodyColor }) {
  ctx.fillStyle = topColor;
  ctx.fillRect(x, y, width, 10);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y + 10, width, height - 10);
}

export function drawPlayerSprite(ctx, { cx, cy, w, h, facing = 1, bodyColor }) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(facing, 1);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-w / 2, -h / 2 + 8, w, h - 8);
  ctx.fillStyle = "#F3D9B1";
  ctx.beginPath();
  ctx.arc(0, -h / 2 + 4, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3F2B1D";
  ctx.fillRect(2, -h / 2 + 1, 4, 3);
  ctx.restore();
}

export function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}
