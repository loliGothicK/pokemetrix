import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/shims/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      reporter: ["text", "html", "json-summary"],
    },
  },
  plugins: [wasm(), topLevelAwait()],
});
