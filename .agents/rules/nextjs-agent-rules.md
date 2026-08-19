---
description: "Guidelines for working with this specific version of Next.js"
trigger: always_on
---
# STRICT MANDATE: This is NOT the Next.js you know

This project uses a Next.js version (16+) with massive breaking changes compared to your training data. APIs, routing conventions, and file structures have fundamentally changed.

## 1. Zero-Trust Policy for Pre-trained Knowledge
You are **STRICTLY FORBIDDEN** from assuming that standard Next.js App Router conventions (e.g., `middleware.ts`, `loading.tsx`, metadata APIs) behave as you remember. 
Before creating any new Next.js convention files or altering architectural routing:
1. You **MUST** search or read the local documentation in `node_modules/next/dist/docs/`.
2. Use `list_dir` or `grep_search` on `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/` to verify the correct file naming and exports.

## 2. Known Breaking Changes (Examples)
- **Middleware is Dead**: The `middleware.ts` convention is deprecated and has been renamed to `proxy.ts`. It also supports different runtime and config behaviors. Never create a `middleware.ts` file.
- Always check for deprecation notices in the docs before proposing architectural changes.
