import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "oxc", "unicorn", "react", "nextjs"],
  jsPlugins: [
    {
      name: "eslint-js",
      specifier: "oxlint-plugin-eslint",
    },
  ],
  options: {
    denyWarnings: true,
    typeAware: true,
  },
  rules: {
    "typescript/no-deprecated": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-confusing-void-expression": "error",
    "no-empty": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": "error",
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
    "eslint-js/no-restricted-syntax": [
      "error",
      {
        selector: "CatchClause > BlockStatement[body.length=0]",
        message: "コメントがあっても空のcatchは禁止です。エラーハンドリングを記述してください。",
      },
      {
        selector: "CatchClause:not(:has(ThrowStatement))",
        message: "catchブロックではエラーを握りつぶさず、必ず throw で再送出してください。",
      },
    ],
  },
});
