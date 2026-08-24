import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "oxc", "unicorn", "react", "nextjs"],
  options: {
    denyWarnings: true,
    typeAware: true,
  },
  rules: {
    "typescript/no-deprecated": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-restricted-types": [
      "error",
      {
        types: {
          unknown: true,
        },
      },
    ],
    "typescript/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "never",
      },
    ],
  },
});
