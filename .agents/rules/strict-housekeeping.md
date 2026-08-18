---
name: strict-housekeeping
description: "Rules for housekeeping, testing, and cleanup before reporting task completion"
trigger: always_on
---
# Strict Housekeeping & Clean-up

Before concluding any task or reporting completion to the user, you MUST perform the following cleanup steps:

1. **NEVER Report Completion Prematurely (ZERO ERROR POLICY)**: You are strictly prohibited from reporting a task as complete or claiming a fix is successful without FIRST executing `pnpm typecheck` (or `tsc --noEmit`) AND `pnpm build` (to verify Next.js and Contentlayer Zod schemas), ensuring **0 errors**. Never blindly claim a UI looks "beautiful" or functions correctly without absolute verification.
2. **Run Static Analysis & Typechecks**: Always run the project's linter (e.g., `pnpm lint`), TypeScript compiler (`pnpm typecheck`), and the build command (`pnpm build`) to detect unused variables, missing imports, Zod schema violations, or build failures introduced by your edits (including MDX content changes). **If your edits involved any translation JSON files, you MUST also run `pnpm run i18n:check`.** Fix all warnings and errors you caused before stopping.
3. **Execute and Test**: Run the relevant code or tests to verify your implementation actually works in practice, rather than assuming it works based on the source code.
4. **STRICT Workspace Isolation for Scratch Scripts (Operational vs. Scratch)**:
   - **Definition of a Scratch Script**: Any script that contains hardcoded data for a specific test case (e.g., targeting a single MDX file), is meant for one-off data migration, or is used for temporary experimentation/validation is a **Scratch Script**.
   - **Definition of an Operational Script**: Only generic, robust, reusable scripts that apply to the entire repository (e.g., `check-i18n.ts`, `validate_domain.ts`) are considered **Operational Scripts**.
   - **Mandatory Location**: You **MUST** create all Scratch Scripts exclusively inside your dedicated agent scratch directory: `<appDataDir>\brain\<conversation-id>\scratch\`.
   - **Absolute Prohibition**: You are strictly forbidden from placing Scratch Scripts in **ANY** existing project directory. The `scripts/` directories are exclusively for Operational Scripts. Do not put temporary test files in `scripts/`, `src/`, `tmp/`, or anywhere else inside the workspace. **NO EXCEPTIONS.**
   - **Immediate Cleanup**: If you inadvertently create a temporary file or folder inside the project workspace, you must `rm -rf` it immediately after use to leave no trace.
5. **Clean Up Associated Dead Code**: If you remove a feature, component, or UI element, proactively search for and delete all associated dead code. This strictly includes removing orphaned localization keys from translation files (`en/translation.json`, `ja/translation.json`, etc.).
6. **Remove Temporary Debugging Code**: If you added temporary logs (e.g., `console.log`, `console.error`) or experimental code to debug an issue, you MUST remove them and restore the code to its original clean state before reporting completion.
7. **ABSOLUTE PROHIBITION on Destructive Git Commands**: You are strictly forbidden from running `git checkout`, `git restore`, or `git reset` on any files in the workspace. If you need to revert a change you made, do so manually by applying a reverse patch or editing the file directly. NEVER use Git commands to discard working tree changes.
