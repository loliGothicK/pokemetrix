import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [],
  printWidth: 100,
  overrides: [
    {
      files: ["*.test.js", "*.spec.ts"],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ["*.md", "*.html"],
      excludeFiles: ["*.min.js"],
      options: {
        tabWidth: 4,
      },
    },
  ],
});
