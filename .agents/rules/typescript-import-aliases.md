---
description: "Rules for TypeScript imports and path aliases"
trigger: always_on
---
# TypeScript Import Aliases

Never use deep relative imports (e.g., `../../../../data/...`). Always use the path aliases configured in `tsconfig.json` (e.g., `@data/*`, `@locales/*`, `@/*`, `@services/*`).
