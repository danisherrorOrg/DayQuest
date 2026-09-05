import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Only needed so component test files (*.test.jsx) can use JSX — plain
  // pure-logic tests (*.test.js) don't go through this plugin at all.
  plugins: [react()],
  test: {
    environment: "node",
    include: ["client/src/**/*.test.js", "client/src/**/*.test.jsx", "server/src/**/*.test.js"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Component tests opt into `// @vitest-environment jsdom` per-file; the
    // default here stays "node" so the (much more numerous) pure-logic and
    // server tests don't pay for a DOM they don't use.
    setupFiles: ["./server/test/setup.js", "./client/test/setup.js"],
  },
});
