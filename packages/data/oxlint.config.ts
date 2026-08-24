import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "oxc", "unicorn", "react", "nextjs"],
  ignorePatterns: ["tests/champions-mod/**/*"],
  options: {
    denyWarnings: true,
    typeAware: true,
  },
  rules: {
    "typescript/no-deprecated": "error",
    "typescript/no-explicit-any": "error",
  },
});
