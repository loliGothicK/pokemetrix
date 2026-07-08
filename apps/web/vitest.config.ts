import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/shims/server-only.ts", import.meta.url)),
      // Use the Node/CJS wasm build under vitest: it loads the .wasm via fs,
      // sidestepping vite-plugin-wasm's helper (which breaks on Windows/Node).
      "@pokemetrix/damage-calc": fileURLToPath(
        new URL("../../packages/damage-calc/pkg-node/damage_calc.js", import.meta.url),
      ),
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
