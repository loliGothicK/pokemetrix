---
description: "Rules for TypeScript imports and path aliases"
---
# TypeScript Import Aliases

Never use deep relative imports (e.g., `../../../../data/...`). Always use the path aliases configured in `tsconfig.json` (e.g., `@data/*`, `@locales/*`, `@/*`, `@services/*`).
