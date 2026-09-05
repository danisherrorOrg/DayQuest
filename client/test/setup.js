// Runs before every test file (see vitest.config.js's setupFiles), same as
// server/test/setup.js. Guarded so it's a no-op for node-environment test
// files (pure-logic + server tests) — only component tests that opt into
// `// @vitest-environment jsdom` need any of this.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Our vitest.config.js doesn't set `test.globals: true` (kept off so plain
// pure-logic tests don't get an implicit global `expect`/`describe`), which
// means @testing-library/react's own auto-cleanup — which looks for a
// global `afterEach` — never registers. Do it explicitly instead, once,
// so component tests don't each need their own `afterEach(cleanup)`.
if (typeof document !== "undefined") {
  afterEach(() => cleanup());
}

// jsdom implements the <canvas> element itself but has no rendering backend,
// so getContext("2d") returns null there unless the native `canvas` package
// is installed (it isn't, on purpose — see CLAUDE.md on sandbox limits and
// the project's preference for no heavy/native deps). Components that draw
// to a canvas (DialogueRecapScreen's stage backdrop) just need *a* context
// object to call no-op drawing methods on, not real pixels.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = () => ({
    fillStyle: "",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    setTransform() {},
    save() {},
    restore() {},
    translate() {},
    scale() {},
    beginPath() {},
    arc() {},
    fill() {},
    fillRect() {},
    fillText() {},
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop() {} }),
  });
}
