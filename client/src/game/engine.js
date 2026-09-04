import { GROUND_Y, GRAVITY, MOVE_SPEED, JUMP_VELOCITY } from "./constants.js";

// Vanilla-JS canvas engine, deliberately kept outside React's render cycle —
// physics/draw run on a raw requestAnimationFrame loop, same as the original
// single-file version. React only hears about it through the callbacks below.
export class GameEngine {
  constructor(canvas, canvasWrap, { onPopup, onCoinCollected, onFinish }) {
    this.canvas = canvas;
    this.canvasWrap = canvasWrap;
    this.ctx = canvas.getContext("2d");
    this.onPopup = onPopup;
    this.onCoinCollected = onCoinCollected;
    this.onFinish = onFinish;

    this.level = null;
    this.player = null;
    this.camX = 0;
    this.input = { left: false, right: false };
    this.running = false;
    this.rafId = null;
    this.lastTime = null;
    this.cssW = 400;
    this.cssH = 240;

    this._handleResize = this.resizeCanvas.bind(this);
    this._loop = this.loop.bind(this);
    window.addEventListener("resize", this._handleResize);
  }

  solidAt(px) {
    for (const s of this.level.segments) {
      if (px >= s.x1 && px <= s.x2) return s;
    }
    return null;
  }

  resetPlayer() {
    const f = this.level.segments[0];
    this.player = { x: f.x1 + 30, y: GROUND_Y - 34, w: 22, h: 34, vx: 0, vy: 0, onGround: true, checkpoint: f.x1 + 30, facing: 1 };
  }

  resizeCanvas() {
    const rect = this.canvasWrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.cssW = rect.width;
    this.cssH = rect.height;
  }

  start(level) {
    this.level = level;
    this.resetPlayer();
    this.camX = 0;
    this.running = true;
    this.lastTime = null;
    this.resizeCanvas();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this._loop);
  }

  setInput(dir, active) {
    this.input[dir] = active;
  }

  jump() {
    if (this.player && this.player.onGround) {
      this.player.vy = JUMP_VELOCITY;
      this.player.onGround = false;
    }
  }

  update(dt) {
    const { player, level, input } = this;
    player.vx = 0;
    if (input.left) { player.vx = -MOVE_SPEED; player.facing = -1; }
    if (input.right) { player.vx = MOVE_SPEED; player.facing = 1; }
    player.x += player.vx * dt;
    if (player.x < 10) player.x = 10;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    const seg = this.solidAt(player.x);
    if (seg) {
      if (player.y + player.h >= GROUND_Y) {
        player.y = GROUND_Y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.checkpoint = seg.x1 + 20;
      }
    } else {
      player.onGround = false;
    }

    if (player.y > GROUND_Y + 160) {
      player.x = player.checkpoint;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.onGround = true;
      this.onPopup?.("Oops — try that jump again");
    }

    level.coins.forEach((c, idx) => {
      if (c.collected) return;
      const dx = (player.x + player.w / 2) - c.x, dy = (player.y + player.h / 2) - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < c.r + 18) {
        c.collected = true;
        const msg = c.act.key ? (c.act.emoji + " " + c.act.label) : "❔ Black box — no record here";
        this.onPopup?.(msg);
        this.onCoinCollected?.(idx);
      }
    });

    if (player.x >= level.flagX && this.running) {
      this.running = false;
      this.onFinish?.();
    }

    this.camX = Math.max(0, Math.min(player.x - this.cssW * 0.4, level.levelWidth - this.cssW));
  }

  draw() {
    const { ctx, level, player } = this;
    const w = this.cssW, h = this.cssH, dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#4A3B6B");
    grad.addColorStop(1, "#1E1732");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 25; i++) {
      const sx = i * 137 - this.camX * 0.3;
      const sy = (i * 53) % (h * 0.5);
      ctx.fillRect(((sx % (w + 40)) + (w + 40)) % (w + 40), sy, 2, 2);
    }

    ctx.save();
    ctx.translate(-this.camX, 0);

    level.segments.forEach((s) => {
      ctx.fillStyle = "#5C8F5A";
      ctx.fillRect(s.x1, GROUND_Y, s.x2 - s.x1, 10);
      ctx.fillStyle = "#3F6B42";
      ctx.fillRect(s.x1, GROUND_Y + 10, s.x2 - s.x1, h - GROUND_Y - 10);
    });

    const t = performance.now() / 300;
    level.coins.forEach((c) => {
      if (c.collected) return;
      const bobY = c.y + Math.sin(t + c.bob) * 4;
      ctx.beginPath();
      ctx.arc(c.x, bobY, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.act.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = c.act.key ? "#FFF8EC" : "#8A7FA8";
      ctx.stroke();
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.act.emoji, c.x, bobY + 1);
    });

    ctx.fillStyle = "#E8D2B0";
    ctx.fillRect(level.flagX, GROUND_Y - 90, 4, 90);
    ctx.beginPath();
    ctx.moveTo(level.flagX + 4, GROUND_Y - 90);
    ctx.lineTo(level.flagX + 34, GROUND_Y - 80);
    ctx.lineTo(level.flagX + 4, GROUND_Y - 70);
    ctx.closePath();
    ctx.fillStyle = "#C1502E";
    ctx.fill();

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.scale(player.facing, 1);
    ctx.fillStyle = "#C1502E";
    ctx.fillRect(-player.w / 2, -player.h / 2 + 8, player.w, player.h - 8);
    ctx.fillStyle = "#F3D9B1";
    ctx.beginPath();
    ctx.arc(0, -player.h / 2 + 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3F2B1D";
    ctx.fillRect(2, -player.h / 2 + 1, 4, 3);
    ctx.restore();

    ctx.restore();
  }

  loop(ts) {
    if (this.lastTime == null) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 16.6667, 2.5);
    this.lastTime = ts;
    this.update(dt);
    this.draw();
    if (this.running) this.rafId = requestAnimationFrame(this._loop);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this._handleResize);
  }
}
