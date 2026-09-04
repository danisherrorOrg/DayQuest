import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["client/src/**/*.test.js", "server/src/**/*.test.js"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./server/test/setup.js"],
  },
});
